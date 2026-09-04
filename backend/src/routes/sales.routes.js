const express = require("express");
const {
  getSales,
  createSale,
  getReturns,
  createReturn,
} = require("../controllers/sales.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const router = express.Router();
router.get(
  "/sales",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR"]),
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
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR"]),
  getReturns,
);
router.post(
  "/returns",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "DISTRIBUTOR"]),
  createReturn,
);
module.exports = router;
