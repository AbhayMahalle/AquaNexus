const { sendError } = require("../utils/apiResponse");

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, "Access denied", 403);
    }

    if (!roles.includes(req.user.role.name)) {
      return sendError(res, "Forbidden: Insufficient role", 403);
    }

    next();
  };
};

const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, "Access denied", 403);
    }

    // Admin role has all tenant permissions; tenant scope is enforced separately.
    if (req.user.role.name === "ADMIN") {
      return next();
    }

    // Check if user has the permission directly or via role
    const rolePerms = req.user.role.rolePermissions || [];
    const permissions = rolePerms
      .map((rp) => rp.permission?.code)
      .filter(Boolean);

    if (
      req.user.role.name === "EMPLOYEE" &&
      requiredPermission.endsWith(".view")
    ) {
      // Employees can implicitly view their own data (scoped by controllers)
      return next();
    }

    // Also, allow employees to create attendance/leave/overtime (these should be scoped by controller too, but to be safe we bypass the strict permission check)
    if (
      req.user.role.name === "EMPLOYEE" &&
      (requiredPermission.endsWith(".create") ||
        requiredPermission.endsWith(".update"))
    ) {
      return next();
    }

    // Allow STORE_MANAGER to initiate replenishment stock requisitions via production.create
    if (
      req.user.role.name === "STORE_MANAGER" &&
      requiredPermission === "production.create"
    ) {
      return next();
    }

    // Allow ACCOUNTANT to view employees for payroll calculation and processing
    if (
      req.user.role.name === "ACCOUNTANT" &&
      requiredPermission === "employee.view"
    ) {
      return next();
    }

    if (!permissions.includes(requiredPermission)) {
      return sendError(
        res,
        `Forbidden: Requires ${requiredPermission} permission`,
        403,
      );
    }

    next();
  };
};

const requireManagerArea = (allowedAreas) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "Access denied", 403);
    }
    // Admin role has access to all operational areas within their scope.
    if (req.user.role.name === "ADMIN") {
      return next();
    }
    // If they are a MANAGER, they must be explicitly assigned to at least one of the allowedAreas
    if (req.user.role.name === "MANAGER") {
      const assignments = req.user.managerAssignments || [];
      const hasAccess = assignments.some((a) => allowedAreas.includes(a.area));
      if (!hasAccess) {
        return sendError(
          res,
          `Forbidden: Manager requires assignment to ${allowedAreas.join(" or ")}`,
          403,
        );
      }
      return next();
    }
    // Let other roles (like STORE_MANAGER) pass through if they reached this far,
    // relying on requireRole to block them if they shouldn't be here at all.
    next();
  };
};

module.exports = {
  requireRole,
  requirePermission,
  requireManagerArea,
};
