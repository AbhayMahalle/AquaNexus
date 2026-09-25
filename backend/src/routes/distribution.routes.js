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

const router = express.Router();

router.get("/sales-areas", requireAuth, getSalesAreas);
router.post(
  "/sales-areas",
  requireAuth,
  requireRole(["ADMIN", "MANAGER"]),
  createSalesArea,
);

router.get("/distributors", requireAuth, getDistributors);
router.post(
  "/distributors",
  requireAuth,
  requireRole(["ADMIN", "MANAGER"]),
  createDistributor,
);

router.get("/distributor-stock", requireAuth, getDistributorStock);

module.exports = router;
