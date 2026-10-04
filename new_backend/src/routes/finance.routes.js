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
  updatePayroll,
} = require("../controllers/finance.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireTenantContext } = require("../middleware/tenant.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const router = express.Router();
const financeGuards = [requireAuth, requireTenantContext];

router.get(
  "/invoices",
  financeGuards,
  requireRole(["ADMIN", "MANAGER", "ACCOUNTANT", "DISTRIBUTOR"]),
  getInvoices,
);
router.post(
  "/invoices",
  financeGuards,
  requireRole(["ADMIN", "MANAGER", "ACCOUNTANT"]),
  createInvoice,
);
router.get(
  "/payments",
  financeGuards,
  requireRole(["ADMIN", "MANAGER", "ACCOUNTANT", "DISTRIBUTOR"]),
  getPayments,
);
router.post(
  "/payments",
  financeGuards,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  createPayment,
);
router.get(
  "/expenses",
  financeGuards,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  getExpenses,
);
router.post(
  "/expenses",
  financeGuards,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  createExpense,
);
router.get(
  "/payroll",
  financeGuards,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  getPayroll,
);
router.post(
  "/payroll",
  financeGuards,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  createPayroll,
);
router.patch(
  "/payroll/:id",
  financeGuards,
  requireRole(["ADMIN", "ACCOUNTANT"]),
  updatePayroll,
);

module.exports = router;
