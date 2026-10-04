const express = require("express");
const {
  createRequisition,
  getRequisitions,
  getRequisitionById,
  finalizeRatesAndApprove,
  rejectRequisition,
  generatePurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  vendorAcceptOrder,
  vendorRejectOrder,
  createDeliveryChallan,
  markChallanOutForDelivery,
  processGoodsReceived,
  submitVendorInvoice,
  reviewVendorInvoice,
  recordPayment,
  getCycleTracker,
  getDashboardStats,
} = require("../controllers/p2p.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireTenantContext } = require("../middleware/tenant.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const router = express.Router();

// Enforce auth & tenant context across all P2P endpoints
router.use(requireAuth, requireTenantContext);

// Dashboard & Tracker (Read-only, visible to all roles including Admin)
router.get("/dashboard-stats", getDashboardStats);
router.get("/tracker/:id", getCycleTracker);

// Step 1: Purchase Requisitions (PR) — Initiated strictly by Store Manager
router.get("/requisitions", getRequisitions);
router.post("/requisitions", requireRole(["STORE_MANAGER"]), createRequisition);
router.get("/requisitions/:id", getRequisitionById);

// Step 2: Rate Finalisation & Approval/Rejection — Operational Manager only
router.post("/requisitions/:id/finalize-rates", requireRole(["MANAGER"]), finalizeRatesAndApprove);
router.post("/requisitions/:id/reject-rates", requireRole(["MANAGER"]), rejectRequisition);
router.post("/requisitions/:id/generate-po", requireRole(["STORE_MANAGER", "MANAGER"]), generatePurchaseOrder);

// Step 3: Purchase Orders & Vendor Actions — Vendor / Supplier only
router.get("/orders", getPurchaseOrders);
router.get("/orders/:id", getPurchaseOrderById);
router.post("/orders/:id/vendor-accept", requireRole(["SUPPLIER"]), vendorAcceptOrder);
router.post("/orders/:id/vendor-reject", requireRole(["SUPPLIER"]), vendorRejectOrder);
router.post("/orders/:id/create-challan", requireRole(["SUPPLIER"]), createDeliveryChallan);
router.post("/challans/:id/dispatch", requireRole(["SUPPLIER"]), markChallanOutForDelivery);

// Step 4: Goods Received (GRN) & Store Stock Inward — Store Manager only
router.post("/orders/:id/goods-received", requireRole(["STORE_MANAGER"]), processGoodsReceived);

// Step 5: Vendor Invoice, 3-Way Match & Payment — Supplier for invoice, Accountant for settlement
router.post("/orders/:id/invoices", requireRole(["SUPPLIER"]), submitVendorInvoice);
router.post("/invoices/:id/review", requireRole(["ACCOUNTANT"]), reviewVendorInvoice);
router.post("/invoices/:id/payment", requireRole(["ACCOUNTANT"]), recordPayment);

module.exports = router;
