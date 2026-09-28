const express = require("express");
const {
  getSales,
  createSale,
  getReturns,
  createReturn,
} = require("../controllers/sales.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const { requireManagerArea } = require("../middleware/managerAccess.middleware");

const router = express.Router();
router.use(requireManagerArea("DISTRIBUTION"));
router.get(
  "/sales",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR", "ACCOUNTANT"]),
  getSales,
);
router.post(
  "/sales",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR"]),
  createSale,
);
router.get(
  "/returns",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR", "STORE_MANAGER"]),
  getReturns,
);
router.post(
  "/returns",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR", "STORE_MANAGER"]),
  createReturn,
);
module.exports = router;
