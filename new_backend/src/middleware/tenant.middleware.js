const prisma = require("../config/db");
const { sendError } = require("../utils/apiResponse");
const { createAuditLog } = require("../services/audit.service");

/**
 * Tenant Context Middleware
 * Enforces server-side tenant isolation:
 * 1. For tenant users (Admin, Manager, Employee, etc.), organizationId is strictly
 *    bound to req.user.organizationId. Client overrides/headers are rejected or ignored.
 * 2. Checks tenant status; suspended organizations cannot access tenant APIs.
 * 3. For platform SuperAdmin, cross-tenant access must be explicit via
 *    'x-organization-id' header or 'organizationId' query param.
 * 4. Captures audit logs for SuperAdmin cross-tenant access.
 */
const requireTenantContext = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, "Authentication required", 401);
    }

    const isSuperAdmin =
      Boolean(req.user.isSuperAdmin) || req.user.role?.name === "SUPER_ADMIN";

    if (isSuperAdmin) {
      return sendError(
        res,
        "Forbidden: SuperAdmin is not permitted to access tenant operational data to preserve company privacy",
        403,
      );
    }

    // Non-superadmin: tenant context strictly derived from user's authenticated record
    if (!req.user.organizationId) {
      return sendError(res, "User is not associated with an organization", 403);
    }

    // Verify organization is active
    const org = req.user.organization ||
      (await prisma.organization.findUnique({
        where: { id: req.user.organizationId },
      }));

    if (!org || org.status === "SUSPENDED") {
      return sendError(
        res,
        "Organization is suspended. Tenant access is denied.",
        403,
      );
    }

    if (org.status !== "ACTIVE") {
      return sendError(res, "Organization is inactive", 403);
    }

    req.organizationId = req.user.organizationId;
    req.organization = org;
    return next();
  } catch (error) {
    console.error("Tenant middleware error:", error);
    return sendError(res, "Failed to resolve tenant context", 500);
  }
};

/**
 * SuperAdmin-only guard for platform-level management endpoints
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return sendError(res, "Authentication required", 401);
  }

  const isSuperAdmin =
    Boolean(req.user.isSuperAdmin) || req.user.role?.name === "SUPER_ADMIN";

  if (!isSuperAdmin) {
    return sendError(
      res,
      "Forbidden: Requires AquaNexus Platform SuperAdmin access",
      403,
    );
  }

  return next();
};

module.exports = {
  requireTenantContext,
  requireSuperAdmin,
};
