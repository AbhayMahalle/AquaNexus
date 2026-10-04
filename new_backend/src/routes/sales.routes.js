const express = require("express");
const {
  getSales,
  createSale,
  getReturns,
  createReturn,
} = require("../controllers/sales.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const { requireTenantContext } = require("../middleware/tenant.middleware");
const { requireManagerArea } = require("../middleware/managerAccess.middleware");

const router = express.Router();
const salesGuards = [requireAuth, requireTenantContext, requireManagerArea("DISTRIBUTION")];

router.get(
  "/sales",
  salesGuards,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR", "ACCOUNTANT"]),
  getSales,
);
router.post(
  "/sales",
  salesGuards,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR"]),
  createSale,
);
router.get(
  "/returns",
  salesGuards,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR", "STORE_MANAGER"]),
  getReturns,
);
router.post(
  "/returns",
  salesGuards,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR", "STORE_MANAGER"]),
  createReturn,
);
module.exports = router;
