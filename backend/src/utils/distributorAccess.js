const INTERNAL_DISTRIBUTOR_ROLES = [
  "ADMIN",
  "MANAGER",
  "STORE_MANAGER",
  "ACCOUNTANT",
];

const isInternalRole = (req) =>
  INTERNAL_DISTRIBUTOR_ROLES.includes(req.user?.role?.name);

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
