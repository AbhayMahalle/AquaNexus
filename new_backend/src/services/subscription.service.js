const prisma = require('../config/db');

/**
 * Centralized SaaS Subscription & Entitlement Service
 * Platform Owner: Aazira Solution
 *
 * Rules:
 * 1. ADMIN: Exactly 1 company Admin per company in every plan.
 * 2. EMPLOYEE: Unlimited employees in every plan. Employees must never count toward subscription limits.
 * 3. BASIC: Allow a maximum of 1 user per each non-Admin, non-Employee business role (e.g. Manager, Accountant, Store Manager, Distributor, Supplier).
 * 4. PRO: Allow a maximum of 5 users per each non-Admin, non-Employee business role.
 * 5. PRO MAX: Allow Super Admin to configure a custom limit for each business role independently.
 *
 * Concurrency Safety:
 * Uses PostgreSQL advisory transaction locks inside transactions to prevent race conditions during concurrent user creation.
 */

// Helper to determine if a role is a restricted business role
function isBusinessRole(roleName) {
  const normalized = (roleName || '').trim().toUpperCase();
  return normalized !== 'ADMIN' && normalized !== 'EMPLOYEE' && normalized !== 'SUPER_ADMIN';
}

/**
 * Determine the configured or default limit for a given role under a subscription plan
 */
function resolveRoleLimit(planCode, roleName, customRoleLimits = {}, planMaxUsers = 1) {
  const normalizedRole = (roleName || '').trim().toUpperCase();
  const code = (planCode || 'BASIC').trim().toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return 1; // Always strictly 1 Admin per company
  }

  if (normalizedRole === 'EMPLOYEE') {
    return Infinity; // Unlimited in every plan
  }

  if (normalizedRole === 'SUPER_ADMIN') {
    return 0; // Platform level only
  }

  // Check if explicit limit is configured in customRoleLimits
  const explicit =
    customRoleLimits &&
    (customRoleLimits[normalizedRole] !== undefined
      ? customRoleLimits[normalizedRole]
      : customRoleLimits[roleName]);

  if (explicit !== undefined && explicit !== null && !isNaN(Number(explicit))) {
    return parseInt(Number(explicit), 10);
  }

  // Default plan tiers
  if (code === 'BASIC') {
    return 1;
  }

  if (code === 'PLUS') {
    return 2;
  }

  if (code === 'PRO') {
    return 5;
  }

  if (code === 'PRO_MAX') {
    // If Pro Max has a default or unassigned role, default to 10 or configured capacity
    if (customRoleLimits && customRoleLimits.DEFAULT !== undefined) {
      return parseInt(Number(customRoleLimits.DEFAULT), 10);
    }
    return Math.max(10, Number(planMaxUsers) || 10);
  }

  // Custom or any newly created plan tier from DB: use plan's configured capacity
  const defaultCapacity = Number(planMaxUsers) || 1;
  return Math.max(1, defaultCapacity);
}

/**
 * Fetch active or latest subscription for a company
 */
async function getCompanySubscription(organizationId, client = prisma) {
  if (!organizationId) {
    throw new Error('organizationId is required to fetch subscription');
  }

  const sub = await client.companySubscription.findFirst({
    where: { organizationId },
    include: {
      plan: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          contactEmail: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return sub;
}

/**
 * Get comprehensive usage and limits for a company with per-role breakdown
 */
async function getCompanyUsageAndLimits(organizationId, client = prisma) {
  const subscription = await getCompanySubscription(organizationId, client);

  if (!subscription) {
    return {
      hasSubscription: false,
      status: 'EXPIRED',
      plan: null,
      maxUsers: 0,
      currentUsage: 0,
      remaining: 0,
      isLimitReached: true,
      roleLimits: {},
      roleBreakdown: [],
      features: [],
    };
  }

  // Fetch all roles from database (excluding Super Admin)
  const allRoles = await client.role.findMany({
    where: { name: { not: 'SUPER_ADMIN' } },
    orderBy: { name: 'asc' },
  });

  // Fetch all users in organization with their roles
  const usersInOrg = await client.user.findMany({
    where: {
      organizationId,
      isSuperAdmin: false,
    },
    select: {
      id: true,
      userRoles: {
        select: {
          role: { select: { id: true, name: true, description: true } },
        },
      },
    },
  });

  // Calculate user counts per role
  const roleCounts = {};
  allRoles.forEach((r) => {
    roleCounts[r.name.toUpperCase()] = 0;
  });

  usersInOrg.forEach((u) => {
    const roleName = u.userRoles[0]?.role?.name?.toUpperCase() || 'EMPLOYEE';
    roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
  });

  const planCode = subscription.plan?.code?.toUpperCase() || 'BASIC';
  const customRoleLimits = subscription.roleLimits || subscription.plan?.roleLimits || {};

  const roleLimits = {};
  const roleBreakdown = [];
  let anyBusinessLimitReached = false;
  let totalBusinessUsage = 0;
  let totalBusinessCapacity = 0;

  allRoles.forEach((r) => {
    const rName = r.name.toUpperCase();
    const count = roleCounts[rName] || 0;

    if (rName === 'ADMIN') {
      const isReached = count >= 1;
      roleLimits[rName] = {
        roleId: r.id,
        roleName: r.name,
        currentUsage: count,
        maxLimit: 1,
        remaining: Math.max(0, 1 - count),
        isLimitReached: isReached,
        unlimited: false,
        isBusinessRole: false,
      };
      roleBreakdown.push(roleLimits[rName]);
    } else if (rName === 'EMPLOYEE') {
      roleLimits[rName] = {
        roleId: r.id,
        roleName: r.name,
        currentUsage: count,
        maxLimit: 'UNLIMITED',
        remaining: 'UNLIMITED',
        isLimitReached: false,
        unlimited: true,
        isBusinessRole: false,
      };
      roleBreakdown.push(roleLimits[rName]);
    } else {
      // Business role
      const planMaxUsers = subscription.maxUsers || subscription.plan?.maxUsers || 1;
      const limit = resolveRoleLimit(planCode, rName, customRoleLimits, planMaxUsers);
      const isReached = count >= limit;
      if (isReached) {
        anyBusinessLimitReached = true;
      }
      totalBusinessUsage += count;
      totalBusinessCapacity += limit;

      roleLimits[rName] = {
        roleId: r.id,
        roleName: r.name,
        currentUsage: count,
        maxLimit: limit,
        remaining: Math.max(0, limit - count),
        isLimitReached: isReached,
        unlimited: false,
        isBusinessRole: true,
      };
      roleBreakdown.push(roleLimits[rName]);
    }
  });

  // Check expiration if endDate is set
  let effectiveStatus = subscription.status;
  if (
    effectiveStatus === 'ACTIVE' &&
    subscription.endDate &&
    new Date(subscription.endDate) < new Date()
  ) {
    effectiveStatus = 'EXPIRED';
  }

  const features = Array.isArray(subscription.features)
    ? subscription.features
    : Array.isArray(subscription.plan?.features)
      ? subscription.plan.features
      : [];

  return {
    hasSubscription: true,
    subscriptionId: subscription.id,
    organizationId,
    organizationName: subscription.organization?.name,
    status: effectiveStatus,
    plan: {
      id: subscription.plan.id,
      name: subscription.plan.name,
      code: subscription.plan.code,
      description: subscription.plan.description,
      price: subscription.customPrice ?? subscription.plan.price,
      billingCycle: subscription.billingCycle,
      isCustom: subscription.plan.isCustom,
      roleLimits: customRoleLimits,
    },
    startDate: subscription.startDate,
    endDate: subscription.endDate,
    roleLimits,
    roleBreakdown,
    totalUsers: usersInOrg.length,
    adminCount: roleCounts['ADMIN'] || 0,
    employeeCount: roleCounts['EMPLOYEE'] || 0,
    businessUserCount: totalBusinessUsage,
    totalBusinessCapacity,
    // Backwards-compatible fields
    maxUsers: totalBusinessCapacity || subscription.maxUsers || subscription.plan?.maxUsers || 5,
    currentUsage: totalBusinessUsage,
    remaining: Math.max(0, totalBusinessCapacity - totalBusinessUsage),
    isLimitReached: anyBusinessLimitReached,
    features,
  };
}

/**
 * Concurrency-safe assertion that a company can create or assign a user with targetRoleName.
 * Must be called inside a database transaction (tx) before user creation or role update.
 *
 * @param {string} organizationId
 * @param {string} targetRoleName - Name of the role (e.g. 'ADMIN', 'EMPLOYEE', 'MANAGER', 'ACCOUNTANT')
 * @param {object} tx - Prisma transaction client
 * @param {string|null} excludeUserId - Optional user ID being updated (excluded from count)
 */
async function assertCanAddUser(organizationId, targetRoleName, tx, excludeUserId = null) {
  const client = tx || prisma;

  if (!organizationId) {
    const error = new Error('organizationId is required to enforce subscription limits');
    error.statusCode = 400;
    throw error;
  }

  // Strict PostgreSQL advisory lock within the transaction to prevent concurrent race conditions
  if (tx && tx.$executeRawUnsafe) {
    try {
      await tx.$executeRawUnsafe(
        'SELECT pg_advisory_xact_lock(hashtext($1))',
        `org_sub_limit_${organizationId}`,
      );
    } catch {
      // Non-critical if advisory lock fails on mock/in-memory adapters
    }
  }

  // 1. Fetch organization & check suspension
  const org = await client.organization.findUnique({
    where: { id: organizationId },
    select: { id: true, name: true, status: true },
  });

  if (!org) {
    const error = new Error('Company not found');
    error.statusCode = 404;
    throw error;
  }

  if (org.status === 'SUSPENDED') {
    const error = new Error('Company is suspended. User creation is disabled.');
    error.statusCode = 403;
    error.code = 'ORGANIZATION_SUSPENDED';
    throw error;
  }

  // 2. Fetch subscription & check status
  const sub = await client.companySubscription.findFirst({
    where: { organizationId },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) {
    const error = new Error('No active subscription found for this company');
    error.statusCode = 403;
    error.code = 'NO_SUBSCRIPTION';
    throw error;
  }

  if (sub.status === 'SUSPENDED') {
    const error = new Error('Subscription is suspended. Contact Aazira Solution to reactivate.');
    error.statusCode = 403;
    error.code = 'SUBSCRIPTION_SUSPENDED';
    throw error;
  }

  if (sub.status === 'EXPIRED' || (sub.endDate && new Date(sub.endDate) < new Date())) {
    const error = new Error('Subscription has expired. Please renew your plan.');
    error.statusCode = 403;
    error.code = 'SUBSCRIPTION_EXPIRED';
    throw error;
  }

  if (sub.status === 'CANCELLED') {
    const error = new Error('Subscription has been cancelled.');
    error.statusCode = 403;
    error.code = 'SUBSCRIPTION_CANCELLED';
    throw error;
  }

  // Normalize target role
  const roleKey = (targetRoleName || 'EMPLOYEE').trim().toUpperCase();

  // Rule: SUPER_ADMIN cannot be assigned to tenant users
  if (roleKey === 'SUPER_ADMIN') {
    const error = new Error('SuperAdmin account is platform-level and cannot be assigned to tenant users');
    error.statusCode = 403;
    error.code = 'CANNOT_ASSIGN_SUPER_ADMIN';
    throw error;
  }

  // Rule 1: ADMIN - Exactly 1 company Admin per company in every plan
  if (roleKey === 'ADMIN') {
    const adminCount = await client.user.count({
      where: {
        organizationId,
        isSuperAdmin: false,
        userRoles: { some: { role: { name: 'ADMIN' } } },
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
    });

    if (adminCount >= 1) {
      const error = new Error(
        'Each company is allowed exactly 1 company Admin. Creating additional Admin accounts is prohibited.',
      );
      error.statusCode = 403;
      error.code = 'ADMIN_LIMIT_EXCEEDED';
      error.details = {
        role: 'ADMIN',
        maxLimit: 1,
        currentUsage: adminCount,
        remaining: 0,
      };
      throw error;
    }

    return {
      allowed: true,
      role: 'ADMIN',
      currentUsage: adminCount,
      maxLimit: 1,
      remaining: 0,
    };
  }

  // Rule 2: EMPLOYEE - Unlimited employees in every plan. Never count toward quota.
  if (roleKey === 'EMPLOYEE') {
    return {
      allowed: true,
      role: 'EMPLOYEE',
      unlimited: true,
    };
  }

  // Rules 3, 4, 5: Business Roles (Manager, Accountant, Store Manager, Distributor, Supplier, etc.)
  const planCode = sub.plan?.code?.toUpperCase() || 'BASIC';
  const customRoleLimits = sub.roleLimits || sub.plan?.roleLimits || {};
  const planMaxUsers = sub.maxUsers || sub.plan?.maxUsers || 1;
  const maxLimit = resolveRoleLimit(planCode, roleKey, customRoleLimits, planMaxUsers);

  const currentRoleCount = await client.user.count({
    where: {
      organizationId,
      isSuperAdmin: false,
      userRoles: { some: { role: { name: roleKey } } },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });

  if (currentRoleCount >= maxLimit) {
    const planName = sub.plan?.name || sub.plan?.code || 'Current Plan';
    const error = new Error(
      `Subscription limit reached for role '${roleKey}'. Your ${planName} allows up to ${maxLimit} user(s) for this role. Upgrade your plan to add more.`,
    );
    error.statusCode = 403;
    error.code = 'SUBSCRIPTION_LIMIT_REACHED';
    error.roleCode = 'ROLE_LIMIT_REACHED';
    error.details = {
      role: roleKey,
      currentUsage: currentRoleCount,
      maxLimit,
      remaining: 0,
      plan: sub.plan?.code,
      planName,
      upgradeRequired: true,
    };
    throw error;
  }

  return {
    allowed: true,
    role: roleKey,
    currentUsage: currentRoleCount,
    maxLimit,
    remaining: maxLimit - currentRoleCount - 1,
  };
}

/**
 * Assign or change a company's subscription plan (Super Admin only)
 * Supports configuring custom per-role limits for Pro Max and other plans
 */
async function assignCompanyPlan(
  organizationId,
  {
    planCode,
    maxUsers,
    roleLimits,
    customPrice,
    billingCycle,
    durationDays = 30,
    status = 'ACTIVE',
    notes,
    performedById,
  },
  client = prisma,
) {
  // 1. Verify plan exists
  const plan = await client.subscriptionPlan.findUnique({
    where: { code: planCode.toUpperCase() },
  });

  if (!plan) {
    throw new Error(`Plan code '${planCode}' not found`);
  }

  const effectiveMaxUsers =
    maxUsers !== undefined && maxUsers !== null
      ? parseInt(maxUsers, 10)
      : plan.maxUsers;

  const effectivePrice =
    customPrice !== undefined && customPrice !== null
      ? customPrice
      : plan.price;

  // Stored roleLimits: if passed explicitly, use it; otherwise fallback to plan default or null
  const effectiveRoleLimits =
    roleLimits !== undefined && roleLimits !== null
      ? roleLimits
      : plan.roleLimits || null;

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // 2. Perform in transaction
  return await client.$transaction(
    async (tx) => {
      const existing = await tx.companySubscription.findFirst({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
      });

      let subscription;
      if (existing) {
        subscription = await tx.companySubscription.update({
          where: { id: existing.id },
          data: {
            planId: plan.id,
            status,
            startDate,
            endDate,
            maxUsers: effectiveMaxUsers,
            roleLimits: effectiveRoleLimits,
            customPrice: effectivePrice,
            billingCycle: billingCycle || plan.billingCycle,
            features: plan.features,
            notes: notes || existing.notes,
          },
          include: { plan: true },
        });
      } else {
        subscription = await tx.companySubscription.create({
          data: {
            organizationId,
            planId: plan.id,
            status,
            startDate,
            endDate,
            maxUsers: effectiveMaxUsers,
            roleLimits: effectiveRoleLimits,
            customPrice: effectivePrice,
            billingCycle: billingCycle || plan.billingCycle,
            features: plan.features,
            notes,
          },
          include: { plan: true },
        });
      }

      // Record subscription history
      await tx.subscriptionHistory.create({
        data: {
          organizationId,
          subscriptionId: subscription.id,
          action: existing ? 'PLAN_UPDATED' : 'PLAN_ASSIGNED',
          details: {
            planCode: plan.code,
            planName: plan.name,
            maxUsers: effectiveMaxUsers,
            roleLimits: effectiveRoleLimits,
            price: effectivePrice,
            status,
            durationDays,
          },
          performedById: performedById || null,
        },
      });

      return subscription;
    },
    { timeout: 25000, maxWait: 15000 },
  );
}

/**
 * Record a payment for a company subscription
 */
async function recordSubscriptionPayment(
  {
    organizationId,
    subscriptionId,
    amount,
    currency = 'INR',
    paymentMethod = 'BANK_TRANSFER',
    paymentType = 'MANUAL',
    transactionRef,
    notes,
    recordedById,
  },
  client = prisma,
) {
  return await client.$transaction(async (tx) => {
    const payment = await tx.subscriptionPayment.create({
      data: {
        organizationId,
        subscriptionId: subscriptionId || null,
        amount,
        currency,
        paymentMethod,
        paymentType,
        transactionRef: transactionRef || null,
        notes: notes || null,
        status: 'COMPLETED',
        recordedById: recordedById || null,
      },
    });

    if (subscriptionId) {
      const sub = await tx.companySubscription.findUnique({
        where: { id: subscriptionId },
      });
      if (sub && (sub.status === 'EXPIRED' || sub.status === 'TRIAL')) {
        await tx.companySubscription.update({
          where: { id: subscriptionId },
          data: { status: 'ACTIVE' },
        });
      }
    }

    return payment;
  });
}

module.exports = {
  isBusinessRole,
  resolveRoleLimit,
  getCompanySubscription,
  getCompanyUsageAndLimits,
  assertCanAddUser,
  assignCompanyPlan,
  recordSubscriptionPayment,
};
