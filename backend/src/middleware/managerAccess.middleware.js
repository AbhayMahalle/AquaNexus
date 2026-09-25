const { sendError } = require("../utils/apiResponse");

/**
 * Middleware to restrict access based on ManagerArea assignments.
 * ADMIN roles automatically bypass this check.
 * 
 * @param {string} requiredArea - The ManagerArea enum value required (e.g., "PRODUCTION", "STORE", "DISTRIBUTION")
 */
const requireManagerArea = (requiredArea) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, "Access denied", 403);
    }

    // Only the 'MANAGER' role requires specific area assignments.
    // Other roles are restricted by their specific RBAC permissions.
    if (req.user.role.name !== "MANAGER") {
      return next();
    }

    // Check if the user has an active manager assignment for the required area
    const assignments = req.user.managerAssignments || [];
    const hasArea = assignments.some(assignment => assignment.area === requiredArea);

    if (!hasArea) {
      return sendError(res, `Forbidden: Requires manager assignment for ${requiredArea}`, 403);
    }

    next();
  };
};

module.exports = {
  requireManagerArea,
};
