const express = require("express");
const {
  getInvoices,
  createInvoice,
  getPayments,
  createPayment,
  getExpenses,
  createExpense,
  getPayroll,
  createPayroll,
  updatePayrollStatus,
  getSuppliers,
} = require("../controllers/finance.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const router = express.Router();

router.get(
  "/suppliers",
  requireAuth,
  requireRole(["ADMIN", "ACCOUNTANT", "MANAGER", "STORE_MANAGER"]),
  getSuppliers,
);
router.get(
  "/invoices",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "ACCOUNTANT", "DISTRIBUTOR"]),
  getInvoices,
);
router.post(
  "/invoices",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "ACCOUNTANT"]),
  createInvoice,
);
router.get(
  "/payments",
  requireAuth,
  requireRole(["ADMIN", "MANAGER", "ACCOUNTANT", "DISTRIBUTOR"]),
  getPayments,
);
router.post(
  "/payments",
  requireAuth,
  requireRole(["ADMIN", "ACCOUNTANT", "DISTRIBUTOR"]),
  createPayment,
);
router.get(
  "/expenses",
  requireAuth,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  getExpenses,
);
router.post(
  "/expenses",
  requireAuth,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  createExpense,
);
router.get(
  "/payroll",
  requireAuth,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  getPayroll,
);
router.post(
  "/payroll",
  requireAuth,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  createPayroll,
);
router.patch(
  "/payroll/:id",
  requireAuth,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  updatePayrollStatus,
);

module.exports = router;
