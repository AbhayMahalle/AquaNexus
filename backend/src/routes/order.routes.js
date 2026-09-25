const express = require("express");
const {
  getOrders,
  getOrderById,
  createOrder,
} = require("../controllers/order.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(["ADMIN", "MANAGER", "STORE_MANAGER", "DISTRIBUTOR"]));

router.get("/", getOrders);
router.post("/", createOrder);
router.get("/:id", getOrderById);

module.exports = router;
