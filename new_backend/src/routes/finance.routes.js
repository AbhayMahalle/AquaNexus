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
} = require("../controllers/finance.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const router = express.Router();

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
  requireRole(["ADMIN", "ACCOUNTANT"]),
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

module.exports = router;
