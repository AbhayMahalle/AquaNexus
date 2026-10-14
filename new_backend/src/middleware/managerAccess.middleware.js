const { sendError } = require("../utils/apiResponse");

/**
 * Middleware to restrict access based on ManagerArea assignments.
 * ADMIN roles automatically bypass this check.
 * 
 * @param {string} requiredArea - The ManagerArea enum value required (e.g., "PRODUCTION", "STORE", "DISTRIBUTION")
 */
const requireManagerArea = (...requiredAreas) => {
  const allowed = requiredAreas.flat();
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, "Access denied", 403);
    }

    // Only the 'MANAGER' role requires specific area assignments.
    // Other roles are restricted by their specific RBAC permissions.
    if (req.user.role.name !== "MANAGER") {
      return next();
    }

    // Check if the user has an active manager assignment for any of the required areas
    const assignments = req.user.managerAssignments || [];
    const hasArea = assignments.some(assignment => allowed.includes(assignment.area));

    if (!hasArea) {
      return sendError(res, `Forbidden: Requires manager assignment for ${allowed.join(' or ')}`, 403);
    }

    next();
  };
};

module.exports = {
  requireManagerArea,
};
