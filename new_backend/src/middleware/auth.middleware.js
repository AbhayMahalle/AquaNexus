const jwt = require("jsonwebtoken");
const { sendError } = require("../utils/apiResponse");
const prisma = require("../config/db");

const getUserWithRetry = async (userId, maxRetries = 2) => {
  if (!userId) return null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
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
          employee: true,
        },
      });
    } catch (err) {
      const isConnectionError =
        err.code === "P1001" ||
        err.message?.includes("Can't reach database server") ||
        err.message?.includes("Connection terminated") ||
        err.name === "DriverAdapterError";

      if (isConnectionError && attempt < maxRetries) {
        console.warn(
          `[Auth] Stale DB connection detected. Retrying with fresh socket (${attempt}/${maxRetries})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 250));
        continue;
      }
      throw err;
    }
  }
};

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return sendError(res, "Invalid or expired token", 401);
    }

    // Load the shared access context used by protected modules (with resilient retry on stale connection)
    const user = await getUserWithRetry(decoded.id || decoded.userId);

    if (!user) {
      return sendError(res, "User not found", 401);
    }

    if (user.status !== "ACTIVE") {
      return sendError(res, "User account is inactive or suspended", 403);
    }

    const primaryRole = user.userRoles[0]?.role || null;
    const isSuperAdmin =
      Boolean(user.isSuperAdmin) || primaryRole?.name === "SUPER_ADMIN";

    // If user is a tenant user and the organization is suspended, deny access
    if (!isSuperAdmin && user.organization && user.organization.status === "SUSPENDED") {
      return sendError(
        res,
        "Organization is suspended. Tenant access is denied.",
        403,
      );
    }

    // Preserve req.user.role for the existing RBAC middleware while using
    // the normalized UserRole schema internally.
    req.user = {
      ...user,
      role: primaryRole,
      isSuperAdmin,
    };
    next();
  } catch (error) {
    if (
      error.code === "P1001" ||
      error.message?.includes("Can't reach database server")
    ) {
      console.error("Auth DB connection error:", error.message);
      return sendError(
        res,
        "Database connection temporarily unavailable. Please retry.",
        503,
      );
    }
    console.error("Auth error:", error);
    return sendError(res, "Authentication failed", 500);
  }
};

module.exports = {
  requireAuth,
};
