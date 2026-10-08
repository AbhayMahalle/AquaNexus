const express = require("express");
const {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
} = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireTenantContext } = require("../middleware/tenant.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const { requireManagerArea } = require("../middleware/managerAccess.middleware");

const router = express.Router();

router.use(requireAuth, requireTenantContext);
router.use(requireRole(["ADMIN", "MANAGER", "STORE_MANAGER", "DISTRIBUTOR"]));
router.use(requireManagerArea("DISTRIBUTION"));

router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id", getOrderById);
router.patch("/:id/status", updateOrderStatus);

module.exports = router;
