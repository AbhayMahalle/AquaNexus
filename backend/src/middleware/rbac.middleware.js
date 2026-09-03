const { sendError } = require('../utils/apiResponse');

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Access denied', 403);
    }

    if (!roles.includes(req.user.role.name)) {
      return sendError(res, 'Forbidden: Insufficient role', 403);
    }

    next();
  };
};

const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 'Access denied', 403);
    }

    // Check if user has the permission directly or via role
    const permissions = req.user.role.rolePermissions.map(rp => rp.permission.name);

    if (!permissions.includes(requiredPermission)) {
      return sendError(res, `Forbidden: Requires ${requiredPermission} permission`, 403);
    }

    next();
  };
};

module.exports = {
  requireRole,
  requirePermission
};
