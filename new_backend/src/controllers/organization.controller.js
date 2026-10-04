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

    const formatted = organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      status: org.status,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
      stats: {
        userCount: org._count.users,
        employeeCount: org._count.employees,
        orderCount: org._count.orders,
        productCount: org._count.products,
      },
      admins: org.users,
    }));

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
    const cleanPhone = (adminPhone || "").trim() || null;

    if (!cleanName || !cleanSlug) {
      return sendError(res, "Organization name and unique slug/code are required", 400);
    }

    if (!cleanEmail || !adminPassword || !cleanFirstName) {
      return sendError(
        res,
        "Initial Admin email, password, and first name are required",
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
        `An organization with slug '${cleanSlug}' already exists ('${existingOrg.name}'). Please choose a different slug.`,
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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name: cleanName,
          slug: cleanSlug,
          status: "ACTIVE",
        },
      });

      // 2. Create Initial Admin User with guaranteed unique username
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

      const passwordHash = await bcrypt.hash(adminPassword, 10);
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

      // 3. Create default primary operational departments for this organization
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

      // 4. Create Employee Profile for Initial Admin so everything is connected across HR
      await tx.employee.create({
        data: {
          organizationId: org.id,
          employeeCode: "ADM001",
          userId: user.id,
          firstName: cleanFirstName,
          lastName: cleanLastName || "Admin",
          email: cleanEmail,
          phone: cleanPhone,
          departmentId: primaryDept.id,
          designation: "Company Administrator",
          joiningDate: new Date(),
          employmentType: "PERMANENT",
          status: "ACTIVE",
        },
      });

      return { org, user };
    });

    await createAuditLog({
      userId: req.user.id,
      organizationId: result.org.id,
      action: "PROVISION_ORGANIZATION",
      entityType: "ORGANIZATION",
      entityId: result.org.id,
      newValues: {
        organization: result.org.name,
        slug: result.org.slug,
        adminEmail: result.user.email,
        adminUsername: result.user.username,
      },
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        organization: result.org,
        adminUser: {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username,
          name: `${result.user.firstName} ${result.user.lastName}`,
        },
      },
      "Customer organization and Admin provisioned successfully",
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

module.exports = {
  getOrganizations,
  getOrganizationById,
  provisionOrganization,
  addOrganizationAdmin,
  updateOrganizationStatus,
};
