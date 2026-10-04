const express = require("express");
const {
  getSalesAreas,
  createSalesArea,
  getDistributors,
  createDistributor,
  getDistributorStock,
} = require("../controllers/distribution.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const { requireTenantContext } = require("../middleware/tenant.middleware");
const { requireManagerArea } = require("../middleware/managerAccess.middleware");

const router = express.Router();
const distributionGuards = [requireAuth, requireTenantContext, requireManagerArea("DISTRIBUTION")];

router.get("/sales-areas", distributionGuards, getSalesAreas);
router.post(
  "/sales-areas",
  distributionGuards,
  requireRole(["ADMIN", "MANAGER"]),
  createSalesArea,
);

router.get("/distributors", distributionGuards, getDistributors);
router.post(
  "/distributors",
  distributionGuards,
  requireRole(["ADMIN", "MANAGER"]),
  createDistributor,
);

router.get("/distributor-stock", distributionGuards, getDistributorStock);

module.exports = router;
