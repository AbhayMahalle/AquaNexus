const INTERNAL_DISTRIBUTOR_ROLES = [
  "ADMIN",
  "MANAGER",
  "STORE_MANAGER",
  "ACCOUNTANT",
];

const isInternalRole = (req) => {
  const roleName =
    typeof req.user?.role === "string"
      ? req.user.role
      : req.user?.role?.name;
  return INTERNAL_DISTRIBUTOR_ROLES.includes(roleName);
};

const getAccessibleDistributorIds = (req) => {
  if (isInternalRole(req)) {
    return null;
  }

  return (req.user?.userDistributors || []).map(
    ({ distributorId }) => distributorId,
  );
};

const canAccessDistributor = (req, distributorId) => {
  const accessibleIds = getAccessibleDistributorIds(req);
  return accessibleIds === null || accessibleIds.includes(distributorId);
};

module.exports = {
  getAccessibleDistributorIds,
  canAccessDistributor,
  isInternalRole,
};
