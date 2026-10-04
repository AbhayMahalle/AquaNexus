const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const userInclude = {
  organization: true,
  userRoles: { include: { role: true } },
  managerAssignments: true,
};

const formatUser = (user) => {
  const { passwordHash, userRoles, ...safeUser } = user;
  return {
    ...safeUser,
    role: userRoles[0]?.role || null,
  };
};

const getUsers = async (req, res) => {
  try {
    const isSuperAdmin =
      Boolean(req.user.isSuperAdmin) || req.user.role?.name === "SUPER_ADMIN";

    const where = {};

    if (!isSuperAdmin) {
      // Admin is strictly scoped to their own organization
      where.organizationId = req.user.organizationId;
      where.isSuperAdmin = false;
    } else if (req.organizationId) {
      // SuperAdmin operating within an explicit tenant context
      where.organizationId = req.organizationId;
    } else if (req.query.organizationId) {
      // SuperAdmin querying with organizationId filter
      where.organizationId = req.query.organizationId;
    }

    if (req.query.role) {
      where.userRoles = {
        some: {
          role: { name: req.query.role.toUpperCase() },
        },
      };
    }

    if (req.query.search) {
      const search = req.query.search;
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: { createdAt: "desc" },
    });

    return sendSuccess(
      res,
      { users: users.map(formatUser) },
      "Users retrieved successfully",
    );
  } catch (error) {
    console.error("getUsers error:", error);
    return sendError(res, "Failed to retrieve users", 500);
  }
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const isSuperAdmin =
      Boolean(req.user.isSuperAdmin) || req.user.role?.name === "SUPER_ADMIN";

    const user = await prisma.user.findUnique({
      where: { id },
      include: userInclude,
    });

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // Verify tenant boundary
    if (!isSuperAdmin) {
      if (user.organizationId !== req.user.organizationId || user.isSuperAdmin) {
        return sendError(res, "User not found", 404);
      }
    } else if (req.organizationId && user.organizationId !== req.organizationId) {
      return sendError(res, "User not found in selected organization", 404);
    }

    return sendSuccess(
      res,
      { user: formatUser(user) },
      "User retrieved successfully",
    );
  } catch (error) {
    console.error("getUser error:", error);
    return sendError(res, "Failed to retrieve user", 500);
  }
};

const createUser = async (req, res) => {
  try {
    const isSuperAdmin =
      Boolean(req.user.isSuperAdmin) || req.user.role?.name === "SUPER_ADMIN";

    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phone,
      roleId,
      organizationId: bodyOrgId,
    } = req.body;

    if (!email || !password || !firstName || !lastName || !roleId) {
      return sendError(
        res,
        "Email, password, names, and role ID are required",
        400,
      );
    }

    // Determine target organization
    let targetOrgId = req.user.organizationId;
    if (isSuperAdmin) {
      targetOrgId = req.organizationId || bodyOrgId;
      if (!targetOrgId) {
        return sendError(
          res,
          "Organization context is required to create a user",
          400,
        );
      }
    } else {
      if (req.body.isSuperAdmin) {
        return sendError(
          res,
          "Regular Admin cannot create a SuperAdmin account",
          403,
        );
      }
      if (bodyOrgId && bodyOrgId !== req.user.organizationId) {
        return sendError(
          res,
          "Regular Admin cannot create users in another organization",
          403,
        );
      }
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleId || '');
    const role = isUuid
      ? await prisma.role.findUnique({ where: { id: roleId } })
      : await prisma.role.findUnique({ where: { name: (roleId || '').toUpperCase() } });

    if (!role) {
      return sendError(res, "Role not found", 400);
    }

    // Admins cannot create or promote to SuperAdmin
    if (role.name === "SUPER_ADMIN") {
      return sendError(
        res,
        "SuperAdmin account is unique and cannot be created via standard user management",
        403,
      );
    }

    // Resolve unique username
    let finalUsername = (username || email.split("@")[0])
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    const existingUsername = await prisma.user.findUnique({
      where: { username: finalUsername },
    });
    if (existingUsername) {
      finalUsername = `${finalUsername}_${Date.now().toString().slice(-4)}`;
    }

    const user = await prisma.$transaction(async (transaction) => {
      return transaction.user.create({
        data: {
          username: finalUsername,
          email,
          passwordHash: await bcrypt.hash(password, 10),
          firstName,
          lastName,
          phone,
          status: "ACTIVE",
          organizationId: targetOrgId,
          isSuperAdmin: false,
          superAdminSlot: null,
          userRoles: { create: { roleId } },
        },
        include: userInclude,
      });
    });

    return sendSuccess(
      res,
      { user: formatUser(user) },
      "User created successfully",
      201,
    );
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(
        res,
        "A user with this username or email already exists",
        409,
      );
    }
    console.error("createUser error:", error);
    return sendError(res, "Failed to create user", 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const isSuperAdmin =
      Boolean(req.user.isSuperAdmin) || req.user.role?.name === "SUPER_ADMIN";

    // Target user check
    const existing = await prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });

    if (!existing) {
      return sendError(res, "User not found", 404);
    }

    // Tenant isolation
    if (!isSuperAdmin) {
      if (existing.organizationId !== req.user.organizationId || existing.isSuperAdmin) {
        return sendError(res, "User not found", 404);
      }
      // Non-superadmin cannot alter their own role or promote/demote SuperAdmin
      if (req.body.isSuperAdmin !== undefined) {
        return sendError(res, "Regular Admin cannot promote themselves or others to SuperAdmin", 403);
      }
      if (req.body.organizationId && req.body.organizationId !== req.user.organizationId) {
        return sendError(res, "Admins cannot move users between organizations", 403);
      }
    }

    const {
      username,
      email,
      firstName,
      lastName,
      phone,
      roleId,
      password,
      status,
    } = req.body;

    const data = { username, email, firstName, lastName, phone, status };
    Object.keys(data).forEach(
      (key) => data[key] === undefined && delete data[key],
    );

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.$transaction(async (transaction) => {
      if (roleId) {
        const role = await transaction.role.findUnique({
          where: { id: roleId },
        });
        if (!role) {
          const error = new Error("Role not found");
          error.statusCode = 400;
          throw error;
        }

        // Admin cannot assign SuperAdmin role
        if (role.name === "SUPER_ADMIN") {
          const error = new Error("SuperAdmin cannot be assigned or promoted");
          error.statusCode = 403;
          throw error;
        }

        await transaction.userRole.deleteMany({ where: { userId: id } });
        await transaction.userRole.create({ data: { userId: id, roleId } });
      }

      return transaction.user.update({
        where: { id },
        data,
        include: userInclude,
      });
    });

    return sendSuccess(
      res,
      { user: formatUser(user) },
      "User updated successfully",
    );
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.code === "P2002") {
      return sendError(
        res,
        "A user with this username or email already exists",
        409,
      );
    }
    console.error("updateUser error:", error);
    return sendError(res, "Failed to update user", 500);
  }
};

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
};
