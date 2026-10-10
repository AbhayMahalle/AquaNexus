const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { createAuditLog } = require('../services/audit.service');
const {
  getCompanySubscription,
  getCompanyUsageAndLimits,
  assignCompanyPlan,
  recordSubscriptionPayment,
} = require('../services/subscription.service');

// ============================================================
// PLATFORM STATISTICS & OVERVIEW
// ============================================================

const getPlatformStats = async (req, res) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      totalUsers,
      subscriptions,
      recentPayments,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),
      prisma.organization.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { isSuperAdmin: false } }),
      prisma.companySubscription.findMany({
        include: { plan: true },
      }),
      prisma.subscriptionPayment.findMany({
        take: 10,
        orderBy: { paidAt: 'desc' },
        include: { organization: { select: { name: true, slug: true } } },
      }),
    ]);

    // Aggregate subscription counts by plan code
    const planBreakdown = {
      BASIC: 0,
      PRO: 0,
      PRO_MAX: 0,
      OTHER: 0,
    };

    let totalRevenue = 0;
    subscriptions.forEach((sub) => {
      const code = sub.plan?.code;
      if (planBreakdown[code] !== undefined) {
        planBreakdown[code]++;
      } else {
        planBreakdown.OTHER++;
      }
    });

    const allPayments = await prisma.subscriptionPayment.aggregate({
      where: { status: 'COMPLETED' },
      _sum: { amount: true },
      _count: true,
    });

    totalRevenue = Number(allPayments._sum.amount || 0);

    return sendSuccess(
      res,
      {
        metrics: {
          totalCompanies,
          activeCompanies,
          suspendedCompanies,
          totalUsers,
          totalRevenue,
        },
        companies: {
          total: totalCompanies,
          active: activeCompanies,
          suspended: suspendedCompanies,
        },
        users: {
          total: totalUsers,
        },
        subscriptions: {
          total: subscriptions.length,
          breakdown: planBreakdown,
        },
        financials: {
          totalRevenue,
          totalTransactions: allPayments._count,
          currency: 'INR',
        },
        recentPayments: recentPayments.map((p) => ({
          id: p.id,
          companyName: p.organization?.name,
          amount: Number(p.amount),
          currency: p.currency,
          paymentMethod: p.paymentMethod,
          paymentType: p.paymentType,
          status: p.status,
          paidAt: p.paidAt,
        })),
      },
      'Platform statistics retrieved successfully',
    );
  } catch (error) {
    console.error('getPlatformStats error:', error);
    return sendError(res, 'Failed to retrieve platform statistics', 500);
  }
};

// ============================================================
// SUPER ADMIN PROFILE & SETTINGS
// ============================================================

const getSuperAdminProfile = async (req, res) => {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isSuperAdmin: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin || !admin.isSuperAdmin) {
      return sendError(res, 'Super Admin profile not found', 404);
    }

    admin.role = 'super_admin';

    return sendSuccess(res, { profile: admin }, 'Super Admin profile retrieved');
  } catch (error) {
    console.error('getSuperAdminProfile error:', error);
    return sendError(res, 'Failed to retrieve profile', 500);
  }
};

const updateSuperAdminProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;

    const data = {};
    if (firstName) data.firstName = firstName.trim();
    if (lastName) data.lastName = lastName.trim();
    if (phone !== undefined) data.phone = phone ? phone.trim() : null;

    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail !== req.user.email) {
        // Validate email uniqueness
        const existing = await prisma.user.findFirst({
          where: { email: cleanEmail, id: { not: req.user.id } },
        });
        if (existing) {
          return sendError(res, 'Email address is already in use by another account', 409);
        }
        data.email = cleanEmail;
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isSuperAdmin: true,
        updatedAt: true,
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_SUPERADMIN_PROFILE',
      entityType: 'USER',
      entityId: req.user.id,
      newValues: data,
      ipAddress: req.ip,
    });

    return sendSuccess(res, { profile: updated }, 'Super Admin profile updated successfully');
  } catch (error) {
    console.error('updateSuperAdminProfile error:', error);
    return sendError(res, 'Failed to update profile', 500);
  }
};

const changeSuperAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Current password and new password are required', 400);
    }

    if (newPassword.length < 8) {
      return sendError(res, 'New password must be at least 8 characters long', 400);
    }

    const admin = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!admin) {
      return sendError(res, 'Account not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Incorrect current password. Verification failed.', 401);
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newHash },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'CHANGE_SUPERADMIN_PASSWORD',
      entityType: 'USER',
      entityId: req.user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(res, null, 'Super Admin password changed successfully');
  } catch (error) {
    console.error('changeSuperAdminPassword error:', error);
    return sendError(res, 'Failed to change password', 500);
  }
};

// ============================================================
// PLATFORM SETTINGS
// ============================================================

const getPlatformSettings = async (req, res) => {
  try {
    const settings = await prisma.platformSetting.findMany({
      orderBy: { key: 'asc' },
    });
    return sendSuccess(res, { settings }, 'Platform settings retrieved');
  } catch (error) {
    console.error('getPlatformSettings error:', error);
    return sendError(res, 'Failed to retrieve settings', 500);
  }
};

const updatePlatformSetting = async (req, res) => {
  try {
    const { key, value, description, category } = req.body;

    if (!key || value === undefined) {
      return sendError(res, 'Setting key and value are required', 400);
    }

    const updated = await prisma.platformSetting.upsert({
      where: { key },
      update: {
        value: String(value),
        description: description || undefined,
        category: category || undefined,
      },
      create: {
        key,
        value: String(value),
        description: description || null,
        category: category || 'GENERAL',
      },
    });

    await createAuditLog({
      userId: req.user.id,
      action: 'UPDATE_PLATFORM_SETTING',
      entityType: 'PLATFORM_SETTING',
      entityId: updated.id,
      newValues: { key, value },
      ipAddress: req.ip,
    });

    return sendSuccess(res, { setting: updated }, `Setting '${key}' updated successfully`);
  } catch (error) {
    console.error('updatePlatformSetting error:', error);
    return sendError(res, 'Failed to update setting', 500);
  }
};

// ============================================================
// SUBSCRIPTION PLANS (Super Admin)
// ============================================================

const getSubscriptionPlans = async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      orderBy: { price: 'asc' },
    });

    const formatted = plans.map((p) => ({
      ...p,
      price: Number(p.price),
    }));

    return sendSuccess(res, { plans: formatted }, 'Subscription plans retrieved');
  } catch (error) {
    console.error('getSubscriptionPlans error:', error);
    return sendError(res, 'Failed to retrieve plans', 500);
  }
};

const createSubscriptionPlan = async (req, res) => {
  try {
    const { name, code, description, price, billingCycle, maxUsers, roleLimits, features, isCustom } = req.body;

    if (!name || !code) {
      return sendError(res, 'Plan name and unique code are required', 400);
    }

    const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');

    const existing = await prisma.subscriptionPlan.findUnique({
      where: { code: cleanCode },
    });
    if (existing) {
      return sendError(res, `A plan with code '${cleanCode}' already exists`, 409);
    }

    const plan = await prisma.subscriptionPlan.create({
      data: {
        name: name.trim(),
        code: cleanCode,
        description: description || null,
        price: price !== undefined ? Number(price) : 0,
        billingCycle: billingCycle || 'MONTHLY',
        maxUsers: maxUsers ? parseInt(maxUsers, 10) : 1,
        roleLimits: roleLimits || null,
        features: features || [],
        isCustom: Boolean(isCustom),
        isActive: true,
      },
    });

    return sendSuccess(res, { plan }, 'Subscription plan created successfully', 201);
  } catch (error) {
    console.error('createSubscriptionPlan error:', error);
    return sendError(res, 'Failed to create plan', 500);
  }
};

const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, billingCycle, maxUsers, roleLimits, features, isActive, isCustom } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (billingCycle) data.billingCycle = billingCycle;
    if (maxUsers !== undefined) data.maxUsers = parseInt(maxUsers, 10);
    if (roleLimits !== undefined) data.roleLimits = roleLimits;
    if (features !== undefined) data.features = features;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    if (isCustom !== undefined) data.isCustom = Boolean(isCustom);

    const updated = await prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    return sendSuccess(res, { plan: updated }, 'Subscription plan updated successfully');
  } catch (error) {
    console.error('updateSubscriptionPlan error:', error);
    return sendError(res, 'Failed to update plan', 500);
  }
};

// ============================================================
// COMPANY SUBSCRIPTIONS & ASSIGNMENT (Super Admin)
// ============================================================

const getCompanySubscriptions = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;

    const subscriptions = await prisma.companySubscription.findMany({
      where,
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

    const formatted = subscriptions.map((s) => ({
      id: s.id,
      companyId: s.organizationId,
      companyName: s.organization?.name,
      companySlug: s.organization?.slug,
      companyStatus: s.organization?.status,
      plan: {
        id: s.plan.id,
        name: s.plan.name,
        code: s.plan.code,
        price: Number(s.customPrice ?? s.plan.price),
        billingCycle: s.billingCycle,
      },
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      maxUsers: s.maxUsers,
      roleLimits: s.roleLimits || s.plan?.roleLimits || null,
      createdAt: s.createdAt,
    }));

    return sendSuccess(res, { subscriptions: formatted }, 'Subscriptions retrieved successfully');
  } catch (error) {
    console.error('getCompanySubscriptions error:', error);
    return sendError(res, 'Failed to retrieve subscriptions', 500);
  }
};

const assignSubscription = async (req, res) => {
  try {
    const targetCompanyId = req.body.companyId || req.body.organizationId || req.params.id;
    let targetPlanCode = req.body.planCode;

    if (!targetPlanCode && req.body.planId) {
      const planObj = await prisma.subscriptionPlan.findUnique({
        where: { id: req.body.planId },
      });
      if (planObj) targetPlanCode = planObj.code;
    }

    if (!targetCompanyId || !targetPlanCode) {
      return sendError(res, 'Company ID and plan code/ID are required', 400);
    }

    const { maxUsers, roleLimits, customPrice, billingCycle, durationDays, notes } = req.body;

    const subscription = await assignCompanyPlan(
      targetCompanyId,
      {
        planCode: targetPlanCode,
        maxUsers,
        roleLimits,
        customPrice,
        billingCycle,
        durationDays: durationDays || 30,
        notes,
        performedById: req.user.id,
      },
      prisma,
    );

    return sendSuccess(res, { subscription }, 'Plan assigned successfully');
  } catch (error) {
    console.error('assignSubscription error:', error);
    return sendError(res, error.message || 'Failed to assign plan', 500);
  }
};

const updateSubscriptionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['ACTIVE', 'TRIAL', 'EXPIRED', 'SUSPENDED', 'CANCELLED'].includes(status)) {
      return sendError(res, 'Invalid subscription status', 400);
    }

    let current = await prisma.companySubscription.findUnique({
      where: { id },
    });
    if (!current) {
      current = await prisma.companySubscription.findFirst({
        where: { organizationId: id },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (!current) {
      return sendError(res, 'Subscription record not found', 404);
    }

    const updated = await prisma.companySubscription.update({
      where: { id: current.id },
      data: {
        status,
        notes: notes || current.notes,
      },
      include: { plan: true },
    });

    await prisma.subscriptionHistory.create({
      data: {
        organizationId: current.organizationId,
        subscriptionId: current.id,
        action: 'STATUS_CHANGED',
        details: { oldStatus: current.status, newStatus: status, notes },
        performedById: req.user.id,
      },
    });

    return sendSuccess(res, { subscription: updated }, `Subscription status changed to ${status}`);
  } catch (error) {
    console.error('updateSubscriptionStatus error:', error);
    return sendError(res, 'Failed to update subscription status', 500);
  }
};

// ============================================================
// PAYMENTS MANAGEMENT (Super Admin)
// ============================================================

const getSubscriptionPayments = async (req, res) => {
  try {
    const payments = await prisma.subscriptionPayment.findMany({
      include: {
        organization: { select: { id: true, name: true, slug: true } },
        subscription: { include: { plan: true } },
        recordedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { paidAt: 'desc' },
    });

    const formatted = payments.map((p) => ({
      id: p.id,
      companyId: p.organizationId,
      companyName: p.organization?.name,
      amount: Number(p.amount),
      currency: p.currency,
      paymentMethod: p.paymentMethod,
      paymentType: p.paymentType,
      transactionRef: p.transactionRef,
      status: p.status,
      paidAt: p.paidAt,
      notes: p.notes,
      recordedBy: p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}`.trim() : null,
      planName: p.subscription?.plan?.name || null,
    }));

    return sendSuccess(res, { payments: formatted }, 'Payments retrieved successfully');
  } catch (error) {
    console.error('getSubscriptionPayments error:', error);
    return sendError(res, 'Failed to retrieve payments', 500);
  }
};

const recordPayment = async (req, res) => {
  try {
    const {
      companyId,
      subscriptionId,
      amount,
      currency,
      paymentMethod,
      paymentType,
      transactionRef,
      notes,
    } = req.body;

    if (!companyId || amount === undefined || Number(amount) <= 0) {
      return sendError(res, 'Company ID and valid payment amount are required', 400);
    }

    const payment = await recordSubscriptionPayment(
      {
        organizationId: companyId,
        subscriptionId,
        amount: Number(amount),
        currency: currency || 'INR',
        paymentMethod: paymentMethod || 'BANK_TRANSFER',
        paymentType: paymentType || 'MANUAL',
        transactionRef,
        notes,
        recordedById: req.user.id,
      },
      prisma,
    );

    return sendSuccess(res, { payment }, 'Payment recorded successfully', 201);
  } catch (error) {
    console.error('recordPayment error:', error);
    return sendError(res, error.message || 'Failed to record payment', 500);
  }
};

// ============================================================
// COMPANY-LEVEL SUBSCRIPTION ENDPOINT (For Company Admin)
// ============================================================

const getCurrentCompanySubscription = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    if (!organizationId) {
      return sendError(res, 'User does not belong to a company', 403);
    }

    const usage = await getCompanyUsageAndLimits(organizationId, prisma);
    usage.limits = {
      maxCreatedUsers: usage.maxUsers,
      maxUsers: usage.maxUsers,
      totalUsers: usage.totalUsers,
      createdUsers: usage.createdUsers,
      remaining: usage.remaining,
      isLimitReached: usage.isLimitReached,
    };

    return sendSuccess(res, { subscription: usage }, 'Company subscription details retrieved');
  } catch (error) {
    console.error('getCurrentCompanySubscription error:', error);
    return sendError(res, 'Failed to retrieve company subscription', 500);
  }
};

module.exports = {
  getPlatformStats,
  getSuperAdminProfile,
  updateSuperAdminProfile,
  changeSuperAdminPassword,
  getPlatformSettings,
  updatePlatformSetting,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getCompanySubscriptions,
  assignSubscription,
  updateSubscriptionStatus,
  getSubscriptionPayments,
  recordPayment,
  getCurrentCompanySubscription,
};
