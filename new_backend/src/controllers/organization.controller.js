const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { createAuditLog } = require("../services/audit.service");

/**
 * List all customer organizations (Platform SuperAdmin only)
 */
const getOrganizations = async (req, res) => {
  try {
    const { status, search } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            orders: true,
            products: true,
          },
        },
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        users: {
          where: {
            userRoles: {
              some: {
                role: { name: "ADMIN" },
              },
            },
          },
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = organizations.map((org) => {
      const activeSub = org.subscriptions?.[0] || null;
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        status: org.status,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone,
        address: org.address,
        city: org.city,
        state: org.state,
        country: org.country,
        postalCode: org.postalCode,
        createdAt: org.createdAt,
        updatedAt: org.updatedAt,
        subscription: activeSub
          ? {
              id: activeSub.id,
              planName: activeSub.plan?.name,
              planCode: activeSub.plan?.code,
              status: activeSub.status,
              maxUsers: activeSub.maxUsers,
              startDate: activeSub.startDate,
              endDate: activeSub.endDate,
              price: Number(activeSub.customPrice ?? activeSub.plan?.price ?? 0),
            }
          : null,
        stats: {
          userCount: org._count.users,
          employeeCount: org._count.employees,
          orderCount: org._count.orders,
          productCount: org._count.products,
        },
        admins: org.users,
      };
    });

    return sendSuccess(
      res,
      { organizations: formatted },
      "Organizations retrieved successfully",
    );
  } catch (error) {
    console.error("getOrganizations error:", error);
    return sendError(res, "Failed to retrieve organizations", 500);
  }
};

/**
 * Get organization by ID (Platform SuperAdmin only)
 */
const getOrganizationById = async (req, res) => {
  try {
    const { id } = req.params;

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            employees: true,
            orders: true,
            products: true,
            departments: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!org) {
      return sendError(res, "Organization not found", 404);
    }

    return sendSuccess(res, { organization: org }, "Organization details retrieved");
  } catch (error) {
    console.error("getOrganizationById error:", error);
    return sendError(res, "Failed to retrieve organization", 500);
  }
};

/**
 * Provision new customer organization + initial Admin account (Platform SuperAdmin only)
 */
const provisionOrganization = async (req, res) => {
  try {
    const {
      name,
      slug,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      country,
      postalCode,
      planCode = "BASIC",
      customMaxUsers,
      customPrice,
      durationDays = 30,
      subscriptionStatus = "ACTIVE",
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      adminUsername,
      adminPhone,
    } = req.body;

    const cleanName = (name || "").trim();
    const cleanSlug = (slug || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");
    const cleanEmail = (adminEmail || "").trim().toLowerCase();
    const cleanFirstName = (adminFirstName || "").trim();
    const cleanLastName = (adminLastName || "").trim();
    const cleanPhone = (adminPhone || contactPhone || "").trim() || null;

    if (!cleanName || !cleanSlug) {
      return sendError(res, "Company name and unique identifier (slug) are required", 400);
    }

    if (!cleanEmail || !cleanFirstName) {
      return sendError(
        res,
        "Initial Company Admin email and first name are required",
        400,
      );
    }

    // Check slug uniqueness case-insensitively
    const existingOrg = await prisma.organization.findFirst({
      where: { slug: { equals: cleanSlug, mode: "insensitive" } },
    });
    if (existingOrg) {
      return sendError(
        res,
        `A company with identifier '${cleanSlug}' already exists ('${existingOrg.name}'). Please choose a different identifier.`,
        409,
      );
    }

    // Check admin email uniqueness case-insensitively
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: "insensitive" } },
      include: { organization: true },
    });
    if (existingUser) {
      return sendError(
        res,
        `A user with email '${cleanEmail}' already exists in '${existingUser.organization?.name || "the system"}'. Please use a different email.`,
        409,
      );
    }

    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });
    if (!adminRole) {
      return sendError(res, "Admin role not configured in system", 500);
    }

    // Resolve initial password or generate secure temporary password
    const rawPassword = adminPassword || `AqNx!${crypto.randomBytes(4).toString('hex')}`;

    // Look up requested plan
    const requestedPlanCode = (planCode || 'BASIC').toUpperCase();
    const plan = (await prisma.subscriptionPlan.findUnique({
      where: { code: requestedPlanCode },
    })) || (await prisma.subscriptionPlan.findFirst({ where: { code: 'BASIC' } }));

    if (!plan) {
      return sendError(res, "Subscription plan configuration not found in database", 500);
    }

    const effectiveMaxUsers =
      requestedPlanCode === 'PRO_MAX' && customMaxUsers
        ? parseInt(customMaxUsers, 10)
        : plan.maxUsers;

    const effectivePrice =
      requestedPlanCode === 'PRO_MAX' && customPrice !== undefined
        ? Number(customPrice)
        : Number(plan.price);

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    // Hash password BEFORE starting the database transaction to prevent interactive transaction timeouts
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const result = await prisma.$transaction(
      async (tx) => {
        // 1. Create Organization (Company) with profile fields
        const org = await tx.organization.create({
          data: {
            name: cleanName,
            slug: cleanSlug,
            status: "ACTIVE",
            contactEmail: contactEmail ? contactEmail.trim().toLowerCase() : cleanEmail,
            contactPhone: cleanPhone,
            address: address ? address.trim() : null,
            city: city ? city.trim() : null,
            state: state ? state.trim() : null,
            country: country ? country.trim() : "India",
            postalCode: postalCode ? postalCode.trim() : null,
          },
        });

        // 2. Create CompanySubscription
        const subscription = await tx.companySubscription.create({
          data: {
            organizationId: org.id,
            planId: plan.id,
            status: subscriptionStatus || "ACTIVE",
            startDate,
            endDate,
            maxUsers: effectiveMaxUsers,
            customPrice: effectivePrice,
            billingCycle: plan.billingCycle,
            features: plan.features,
          },
        });

        // 3. Create Initial Admin User with guaranteed unique username
        let baseUsername = (adminUsername || cleanEmail.split("@")[0])
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "");

        if (!baseUsername) {
          baseUsername = `admin_${cleanSlug.slice(0, 8)}`;
        }

        let finalAdminUsername = baseUsername;
        let attempt = 0;
        while (await tx.user.findUnique({ where: { username: finalAdminUsername } })) {
          attempt++;
          finalAdminUsername = `${baseUsername}_${attempt}_${Date.now().toString().slice(-3)}`;
        }

        const user = await tx.user.create({
          data: {
            username: finalAdminUsername,
            email: cleanEmail,
            passwordHash,
            firstName: cleanFirstName,
            lastName: cleanLastName || "Admin",
            phone: cleanPhone,
            status: "ACTIVE",
          isSuperAdmin: false,
          superAdminSlot: null,
          organizationId: org.id,
          userRoles: {
            create: { roleId: adminRole.id },
          },
        },
      });

      // 4. Create standard operational departments
      const standardDepts = [
        { name: "General Management", code: "GEN", description: "Primary administration department" },
        { name: "Production", code: "PROD", description: "Water purification and bottling" },
        { name: "Store & Inventory", code: "STORE", description: "Raw materials and finished goods warehouse" },
        { name: "Distribution", code: "DIST", description: "Order logistics and distribution network" },
        { name: "Finance & Accounts", code: "FIN", description: "Financial ledgers, payments and invoicing" },
      ];

      const createdDepts = [];
      for (const d of standardDepts) {
        const cd = await tx.department.create({
          data: {
            organizationId: org.id,
            name: d.name,
            code: d.code,
            description: d.description,
            status: "ACTIVE",
          },
        });
        createdDepts.push(cd);
      }

      const primaryDept = createdDepts[0];

      // 5. Record Subscription History
      await tx.subscriptionHistory.create({
        data: {
          organizationId: org.id,
          subscriptionId: subscription.id,
          action: "ONBOARDING_INITIAL_PLAN",
          details: {
            planCode: plan.code,
            planName: plan.name,
            maxUsers: effectiveMaxUsers,
            price: effectivePrice,
            durationDays,
          },
          performedById: req.user.id,
        },
      });

      return { org, user, subscription, plan };
    }, { timeout: 30000, maxWait: 15000 });

    await createAuditLog({
      userId: req.user.id,
      organizationId: result.org.id,
      action: "ONBOARD_COMPANY",
      entityType: "ORGANIZATION",
      entityId: result.org.id,
      newValues: {
        organization: result.org.name,
        slug: result.org.slug,
        plan: result.plan.code,
        maxUsers: effectiveMaxUsers,
        adminEmail: result.user.email,
        adminUsername: result.user.username,
      },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        company: result.org,
        organization: result.org,
        subscription: {
          id: result.subscription.id,
          planName: result.plan.name,
          planCode: result.plan.code,
          status: result.subscription.status,
          maxUsers: result.subscription.maxUsers,
          price: effectivePrice,
          startDate: result.subscription.startDate,
          endDate: result.subscription.endDate,
        },
        adminUser: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          name: `${result.user.firstName} ${result.user.lastName}`,
        },
        activation: {
          adminEmail: result.user.email,
          adminUsername: result.user.username,
          temporaryPassword: rawPassword,
          activationInstructions:
            "Secure onboarding complete. Share temporary activation password with Company Administrator. Password can be updated upon login.",
        },
      },
      "Customer company and Admin onboarded successfully",
      201,
    );
  } catch (error) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      let fieldMsg = "Organization slug or admin email/username already exists";
      if (Array.isArray(target)) {
        if (target.includes("slug")) fieldMsg = "An organization with this slug already exists";
        else if (target.includes("email")) fieldMsg = "An administrator with this email already exists";
        else if (target.includes("username")) fieldMsg = "An administrator with this username already exists";
      } else if (typeof target === "string") {
        if (target.includes("slug")) fieldMsg = "An organization with this slug already exists";
        else if (target.includes("email")) fieldMsg = "An administrator with this email already exists";
      }
      return sendError(res, fieldMsg, 409);
    }
    console.error("provisionOrganization error:", error);
    return sendError(res, error.message || "Failed to provision organization", 500);
  }
};

/**
 * Add an additional Admin to an existing customer organization (Platform SuperAdmin only)
 */
const addOrganizationAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, firstName, lastName, username, phone } = req.body;

    if (!email || !password || !firstName) {
      return sendError(res, "Admin email, password, and first name are required", 400);
    }

    const org = await prisma.organization.findUnique({
      where: { id },
    });
    if (!org) {
      return sendError(res, "Organization not found", 404);
    }

    const adminRole = await prisma.role.findUnique({
      where: { name: "ADMIN" },
    });
    if (!adminRole) {
      return sendError(res, "Admin role not configured in system", 500);
    }

    // Rule 1: Exactly 1 company Admin per company in every plan
    const existingAdminCount = await prisma.user.count({
      where: {
        organizationId: id,
        isSuperAdmin: false,
        userRoles: { some: { role: { name: "ADMIN" } } },
      },
    });
    if (existingAdminCount >= 1) {
      return sendError(
        res,
        "Each company is allowed exactly 1 company Admin. Creating additional Admin accounts is prohibited.",
        403,
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { organization: true, userRoles: { include: { role: true } } },
    });

    if (existingUser) {
      if (existingUser.organizationId === id) {
        // User already in this organization; ensure ADMIN role is assigned
        const hasAdminRole = existingUser.userRoles.some((ur) => ur.role.name === "ADMIN");
        if (!hasAdminRole) {
          await prisma.userRole.create({
            data: { userId: existingUser.id, roleId: adminRole.id },
          });
        }
        return sendSuccess(
          res,
          {
            user: {
              id: existingUser.id,
              email: existingUser.email,
              username: existingUser.username,
              name: `${existingUser.firstName} ${existingUser.lastName}`,
            },
          },
          `User '${existingUser.email}' is now an Admin of ${org.name}`,
          200,
        );
      } else {
        return sendError(
          res,
          `A user with email '${email}' is already associated with '${existingUser.organization?.name || "another organization"}'. Each user must belong to one organization.`,
          409,
        );
      }
    }

    // Resolve unique username
    let finalAdminUsername = (username || email.split("@")[0])
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    const existingByUsername = await prisma.user.findUnique({
      where: { username: finalAdminUsername },
    });
    if (existingByUsername) {
      const cleanSlug = org.slug.toLowerCase().replace(/[^a-z0-9]/g, "");
      finalAdminUsername = `${finalAdminUsername}_${cleanSlug}`;
      const secondCheck = await prisma.user.findUnique({
        where: { username: finalAdminUsername },
      });
      if (secondCheck) {
        finalAdminUsername = `${finalAdminUsername}_${Date.now().toString().slice(-4)}`;
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        username: finalAdminUsername,
        email,
        passwordHash,
        firstName,
        lastName: lastName || "",
        phone: phone || null,
        status: "ACTIVE",
        isSuperAdmin: false,
        superAdminSlot: null,
        organizationId: org.id,
        userRoles: {
          create: { roleId: adminRole.id },
        },
      },
      include: {
        organization: true,
        userRoles: { include: { role: true } },
      },
    });

    await createAuditLog({
      userId: req.user.id,
      organizationId: org.id,
      action: "ADD_ORGANIZATION_ADMIN",
      entityType: "USER",
      entityId: newUser.id,
      newValues: {
        organization: org.name,
        adminEmail: newUser.email,
        adminUsername: newUser.username,
      },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username,
          name: `${newUser.firstName} ${newUser.lastName}`.trim(),
        },
      },
      `Admin '${newUser.email}' added successfully to ${org.name}`,
      201,
    );
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, "Admin email or username already exists", 409);
    }
    console.error("addOrganizationAdmin error:", error);
    return sendError(res, "Failed to add admin to organization", 500);
  }
};

/**
 * Update organization status (activate/suspend) (Platform SuperAdmin only)
 */
const updateOrganizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["ACTIVE", "SUSPENDED", "INACTIVE"].includes(status)) {
      return sendError(
        res,
        "Invalid status. Must be ACTIVE, SUSPENDED, or INACTIVE",
        400,
      );
    }

    const currentOrg = await prisma.organization.findUnique({
      where: { id },
    });
    if (!currentOrg) {
      return sendError(res, "Organization not found", 404);
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { status },
    });

    await createAuditLog({
      userId: req.user.id,
      organizationId: id,
      action: "UPDATE_ORGANIZATION_STATUS",
      entityType: "ORGANIZATION",
      entityId: id,
      oldValues: { status: currentOrg.status },
      newValues: { status },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      { organization: updated },
      `Organization status changed to ${status}`,
    );
  } catch (error) {
    console.error("updateOrganizationStatus error:", error);
    return sendError(res, "Failed to update organization status", 500);
  }
};

/**
 * Get company profile (Company Admin or Super Admin)
 */
const getCompanyProfile = async (req, res) => {
  try {
    const isSuperAdmin = Boolean(req.user.isSuperAdmin) || req.user.role?.name === "SUPER_ADMIN";
    const companyId = isSuperAdmin ? (req.params.id || req.user.organizationId) : req.user.organizationId;

    if (!companyId) {
      return sendError(res, "Company identifier required", 400);
    }

    const org = await prisma.organization.findUnique({
      where: { id: companyId },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!org) {
      return sendError(res, "Company not found", 404);
    }

    return sendSuccess(res, { company: org, organization: org }, "Company profile retrieved");
  } catch (error) {
    console.error("getCompanyProfile error:", error);
    return sendError(res, "Failed to retrieve company profile", 500);
  }
};

/**
 * Update company profile (Company Admin for own company, or Super Admin)
 */
const updateCompanyProfile = async (req, res) => {
  try {
    const isSuperAdmin = Boolean(req.user.isSuperAdmin) || req.user.role?.name === "SUPER_ADMIN";
    const targetId = isSuperAdmin ? (req.params.id || req.user.organizationId) : req.user.organizationId;

    if (!targetId) {
      return sendError(res, "Company ID required", 400);
    }

    const {
      name,
      contactEmail,
      contactPhone,
      address,
      city,
      state,
      country,
      postalCode,
    } = req.body;

    const data = {};
    if (name) data.name = name.trim();
    if (contactEmail !== undefined) data.contactEmail = contactEmail ? contactEmail.trim().toLowerCase() : null;
    if (contactPhone !== undefined) data.contactPhone = contactPhone ? contactPhone.trim() : null;
    if (address !== undefined) data.address = address ? address.trim() : null;
    if (city !== undefined) data.city = city ? city.trim() : null;
    if (state !== undefined) data.state = state ? state.trim() : null;
    if (country !== undefined) data.country = country ? country.trim() : null;
    if (postalCode !== undefined) data.postalCode = postalCode ? postalCode.trim() : null;

    const updated = await prisma.organization.update({
      where: { id: targetId },
      data,
    });

    return sendSuccess(res, { company: updated }, "Company profile updated successfully");
  } catch (error) {
    console.error("updateCompanyProfile error:", error);
    return sendError(res, "Failed to update company profile", 500);
  }
};

/**
 * Cascade Delete Organization (SuperAdmin only)
 * Deletes company, its admin, all users, and all operational tenant data.
 */
const deleteOrganization = async (req, res) => {
  try {
    const targetId = req.params.id;
    if (!targetId) {
      return sendError(res, "Company ID is required", 400);
    }

    const org = await prisma.organization.findUnique({
      where: { id: targetId },
      include: {
        _count: { select: { users: true } },
      },
    });

    if (!org) {
      return sendError(res, "Company not found", 404);
    }

    console.log(`[deleteOrganization] Initiating cascade deletion of company "${org.name}" (${org.id}) with ${org._count.users} users`);

    await prisma.$transaction(
      async (tx) => {
        // 1. P2P & Procurement
        await tx.$executeRawUnsafe(`DELETE FROM p2p_payments WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM vendor_invoices WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM p2p_goods_received_items 
          WHERE grn_id IN (SELECT id FROM p2p_goods_received WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM p2p_goods_received WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM delivery_challan_items 
          WHERE challan_id IN (SELECT id FROM delivery_challans WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM delivery_challans WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM purchase_order_items 
          WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM purchase_orders WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM purchase_requisition_items 
          WHERE requisition_id IN (SELECT id FROM purchase_requisitions WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM purchase_requisitions WHERE organization_id = $1::uuid`, targetId);

        // 2. Financials
        await tx.$executeRawUnsafe(`DELETE FROM payments WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM invoices WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM expenses WHERE organization_id = $1::uuid`, targetId);

        // 3. Sales, Returns, Dispatches, Orders
        await tx.$executeRawUnsafe(`
          DELETE FROM return_items 
          WHERE return_id IN (SELECT id FROM returns WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM returns WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM sale_items 
          WHERE sale_id IN (SELECT id FROM sales WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM sales WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM dispatch_items 
          WHERE dispatch_id IN (SELECT id FROM dispatches WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM dispatches WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM order_items 
          WHERE order_id IN (SELECT id FROM orders WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM orders WHERE organization_id = $1::uuid`, targetId);

        // 4. Production & Inventory & Products
        await tx.$executeRawUnsafe(`DELETE FROM goods_received WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM production WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM stock_transactions WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM inventory WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM distributor_stock 
          WHERE distributor_id IN (SELECT id FROM distributors WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM products WHERE organization_id = $1::uuid`, targetId);

        // 5. HR & Payroll
        await tx.$executeRawUnsafe(`DELETE FROM payroll WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM overtime WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM leaves WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM attendance WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM employees WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM departments WHERE organization_id = $1::uuid`, targetId);

        // 6. External Business Entities
        await tx.$executeRawUnsafe(`
          DELETE FROM user_distributors 
          WHERE distributor_id IN (SELECT id FROM distributors WHERE organization_id = $1::uuid)
        `, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM distributors WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM sales_areas WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM suppliers WHERE organization_id = $1::uuid`, targetId);

        // 7. Subscriptions
        await tx.$executeRawUnsafe(`DELETE FROM subscription_payments WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM subscription_histories WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM company_subscriptions WHERE organization_id = $1::uuid`, targetId);

        // 8. Notifications & Logs
        await tx.$executeRawUnsafe(`DELETE FROM notifications WHERE organization_id = $1::uuid`, targetId);
        await tx.$executeRawUnsafe(`DELETE FROM audit_logs WHERE organization_id = $1::uuid`, targetId);

        // 9. Users (Admins, Managers, Employees, etc. belonging to this company, preserving global SuperAdmin)
        await tx.$executeRawUnsafe(`
          DELETE FROM user_roles 
          WHERE user_id IN (SELECT id FROM users WHERE organization_id = $1::uuid AND is_super_admin = false)
        `, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM manager_assignments 
          WHERE user_id IN (SELECT id FROM users WHERE organization_id = $1::uuid AND is_super_admin = false)
        `, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM user_distributors 
          WHERE user_id IN (SELECT id FROM users WHERE organization_id = $1::uuid AND is_super_admin = false)
        `, targetId);
        await tx.$executeRawUnsafe(`
          DELETE FROM users 
          WHERE organization_id = $1::uuid AND is_super_admin = false
        `, targetId);

        // 10. Organization record
        await tx.$executeRawUnsafe(`DELETE FROM organizations WHERE id = $1::uuid`, targetId);
      },
      { timeout: 60000, maxWait: 15000 }
    );

    if (req.user?.id) {
      await createAuditLog({
        userId: req.user.id,
        action: "DELETE_ORGANIZATION",
        entityType: "ORGANIZATION",
        entityId: targetId,
        oldValues: { name: org.name, slug: org.slug, usersCount: org._count.users },
        ipAddress: req.ip,
      }).catch((e) => console.warn("Audit log creation warning:", e.message));
    }

    return sendSuccess(
      res,
      { id: targetId, name: org.name },
      `Company "${org.name}", its administrators, all associated users, and tenant data were deleted successfully.`
    );
  } catch (error) {
    console.error("deleteOrganization error:", error);
    return sendError(res, error.message || "Failed to delete company", 500);
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  provisionOrganization,
  addOrganizationAdmin,
  updateOrganizationStatus,
  getCompanyProfile,
  updateCompanyProfile,
  deleteOrganization,
};


