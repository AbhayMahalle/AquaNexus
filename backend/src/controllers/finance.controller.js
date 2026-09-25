const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { getAccessibleDistributorIds } = require("../utils/distributorAccess");

const getInvoiceWhere = (req) => {
  const distributorIds = getAccessibleDistributorIds(req);
  if (distributorIds === null) {
    return req.query.distributorId
      ? { distributorId: req.query.distributorId }
      : {};
  }
  return { distributorId: { in: distributorIds } };
};

const formatInvoice = (invoice) => {
  const paidAmount = invoice.payments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalAmount = Number(invoice.totalAmount);

  return {
    ...invoice,
    paidAmount,
    outstandingAmount: Math.max(totalAmount - paidAmount, 0),
  };
};

const getInvoices = async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: getInvoiceWhere(req),
      include: {
        distributor: true,
        order: true,
        sale: true,
        payments: true,
      },
      orderBy: { invoiceDate: "desc" },
    });

    return sendSuccess(
      res,
      { invoices: invoices.map(formatInvoice) },
      "Invoices retrieved successfully",
    );
  } catch (error) {
    console.error("getInvoices error:", error);
    return sendError(res, "Failed to retrieve invoices", 500);
  }
};

const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      distributorId,
      orderId,
      saleId,
      invoiceDate,
      dueDate,
      subtotal,
      discount = 0,
      tax = 0,
      status = "ISSUED",
    } = req.body;

    if (
      !invoiceNumber ||
      !distributorId ||
      !invoiceDate ||
      !dueDate ||
      subtotal === undefined
    ) {
      return sendError(
        res,
        "Invoice number, distributor, dates, and subtotal are required",
        400,
      );
    }

    const invoiceDateValue = new Date(invoiceDate);
    const dueDateValue = new Date(dueDate);
    const totalAmount = Number(subtotal) - Number(discount) + Number(tax);
    if (
      Number.isNaN(invoiceDateValue.getTime()) ||
      Number.isNaN(dueDateValue.getTime()) ||
      dueDateValue < invoiceDateValue
    ) {
      return sendError(res, "Due date must be on or after invoice date", 400);
    }
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return sendError(res, "Invoice values produce an invalid total", 400);
    }

    const accessibleIds = getAccessibleDistributorIds(req);
    if (accessibleIds !== null && !accessibleIds.includes(distributorId)) {
      return sendError(
        res,
        "You cannot create an invoice for this distributor",
        403,
      );
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        distributorId,
        orderId,
        saleId,
        invoiceDate: invoiceDateValue,
        dueDate: dueDateValue,
        subtotal: Number(subtotal),
        discount: Number(discount),
        tax: Number(tax),
        totalAmount,
        status,
      },
      include: { distributor: true, order: true, sale: true, payments: true },
    });

    return sendSuccess(
      res,
      { invoice: formatInvoice(invoice) },
      "Invoice created successfully",
      201,
    );
  } catch (error) {
    if (error.code === "P2002") {
      return sendError(res, "An invoice with this number already exists", 409);
    }
    console.error("createInvoice error:", error);
    return sendError(res, "Failed to create invoice", 500);
  }
};

const getPayments = async (req, res) => {
  try {
    const invoiceWhere = getInvoiceWhere(req);
    const payments = await prisma.payment.findMany({
      where: { invoice: invoiceWhere },
      include: {
        invoice: {
          include: {
            distributor: true,
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return sendSuccess(res, { payments }, "Payments retrieved successfully");
  } catch (error) {
    console.error("getPayments error:", error);
    return sendError(res, "Failed to retrieve payments", 500);
  }
};

const createPayment = async (req, res) => {
  try {
    const {
      invoiceId,
      amount,
      paymentMethod = "BANK_TRANSFER",
      referenceNumber,
      remarks,
    } = req.body;

    const paymentNumber =
      req.body.paymentNumber || `PAY-${Date.now().toString().slice(-6)}`;
    const paymentDate = req.body.paymentDate || new Date().toISOString();

    if (
      !invoiceId ||
      amount === undefined ||
      !paymentMethod
    ) {
      return sendError(
        res,
        "Invoice, amount, and payment method are required",
        400,
      );
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return sendError(res, "Payment amount must be greater than zero", 400);
    }

    const methodMap = {
      ONLINE_UPI: "UPI",
      UPI: "UPI",
      BANK_TRANSFER: "BANK_TRANSFER",
      CHEQUE: "CHEQUE",
      CASH: "CASH",
      OTHER: "OTHER",
    };
    const validPaymentMethod = methodMap[paymentMethod] || "BANK_TRANSFER";

    const payment = await prisma.$transaction(async (transaction) => {
      const invoice = await transaction.invoice.findUnique({
        where: { id: invoiceId },
        include: { payments: true },
      });
      if (!invoice) {
        const error = new Error("Invoice not found");
        error.statusCode = 404;
        throw error;
      }

      const accessibleIds = getAccessibleDistributorIds(req);
      if (
        accessibleIds !== null &&
        !accessibleIds.includes(invoice.distributorId)
      ) {
        const error = new Error("Payment not found");
        error.statusCode = 404;
        throw error;
      }

      const paidAmount = invoice.payments
        .filter((existingPayment) => existingPayment.status === "COMPLETED")
        .reduce(
          (sum, existingPayment) => sum + Number(existingPayment.amount),
          0,
        );
      const outstandingAmount = Number(invoice.totalAmount) - paidAmount;
      if (Number(amount) > outstandingAmount) {
        const error = new Error(
          "Payment exceeds the invoice outstanding amount",
        );
        error.statusCode = 400;
        throw error;
      }

      const createdPayment = await transaction.payment.create({
        data: {
          paymentNumber,
          invoiceId,
          amount: Number(amount),
          paymentDate: new Date(paymentDate),
          paymentMethod: validPaymentMethod,
          referenceNumber,
          status: "COMPLETED",
          remarks,
          createdBy: req.user.id,
        },
        include: { invoice: true },
      });

      const newPaidAmount = paidAmount + Number(amount);
      await transaction.invoice.update({
        where: { id: invoiceId },
        data: {
          status:
            newPaidAmount >= Number(invoice.totalAmount)
              ? "PAID"
              : "PARTIALLY_PAID",
        },
      });

      return createdPayment;
    });

    return sendSuccess(res, { payment }, "Payment recorded successfully", 201);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    if (error.code === "P2002") {
      return sendError(res, "A payment with this number already exists", 409);
    }
    console.error("createPayment error:", error);
    return sendError(res, "Failed to record payment", 500);
  }
};

const getExpenses = async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: { supplier: true, creator: true, approver: true },
      orderBy: { expenseDate: "desc" },
    });
    return sendSuccess(res, { expenses }, "Expenses retrieved successfully");
  } catch (error) {
    console.error("getExpenses error:", error);
    return sendError(res, "Failed to retrieve expenses", 500);
  }
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: "asc" },
    });
    return sendSuccess(res, { suppliers }, "Suppliers retrieved successfully");
  } catch (error) {
    console.error("getSuppliers error:", error);
    return sendError(res, "Failed to retrieve suppliers", 500);
  }
};

const createExpense = async (req, res) => {
  try {
    let {
      expenseNumber,
      category,
      amount,
      expenseDate,
      description,
      supplierId,
    } = req.body;

    if (!expenseNumber) {
      expenseNumber = `EXP-${Date.now().toString().slice(-6)}`;
    }
    if (!expenseDate) {
      expenseDate = new Date().toISOString();
    }
    if (!category || amount === undefined) {
      return sendError(
        res,
        "Expense category and amount are required",
        400,
      );
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return sendError(res, "Expense amount must be greater than zero", 400);
    }
    const parsedDate = new Date(expenseDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return sendError(res, "Expense date is invalid", 400);
    }

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        category,
        amount: Number(amount),
        expenseDate: parsedDate,
        description: description || null,
        supplierId: supplierId || null,
        status: "APPROVED",
        createdBy: req.user.id,
      },
      include: { supplier: true },
    });
    return sendSuccess(res, { expense }, "Expense created successfully", 201);
  } catch (error) {
    if (error.code === "P2002")
      return sendError(res, "An expense with this number already exists", 409);
    console.error("createExpense error:", error);
    return sendError(res, "Failed to create expense", 500);
  }
};

const getPayroll = async (req, res) => {
  try {
    const payroll = await prisma.payroll.findMany({
      include: { employee: true, processor: true },
      orderBy: { payPeriodStart: "desc" },
    });
    return sendSuccess(res, { payroll }, "Payroll retrieved successfully");
  } catch (error) {
    console.error("getPayroll error:", error);
    return sendError(res, "Failed to retrieve payroll", 500);
  }
};

const createPayroll = async (req, res) => {
  try {
    const {
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      basicSalary,
      overtimeAmount = 0,
      deductions = 0,
      status = "DRAFT",
    } = req.body;
    if (
      !employeeId ||
      !payPeriodStart ||
      !payPeriodEnd ||
      basicSalary === undefined
    ) {
      return sendError(
        res,
        "Employee, pay period, and basic salary are required",
        400,
      );
    }
    const start = new Date(payPeriodStart);
    const end = new Date(payPeriodEnd);
    const netSalary =
      Number(basicSalary) + Number(overtimeAmount) - Number(deductions);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end < start
    ) {
      return sendError(
        res,
        "Pay period end must be on or after its start",
        400,
      );
    }
    if (!Number.isFinite(netSalary) || netSalary < 0) {
      return sendError(res, "Salary values produce an invalid net salary", 400);
    }

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        payPeriodStart: start,
        payPeriodEnd: end,
        basicSalary: Number(basicSalary),
        overtimeAmount: Number(overtimeAmount),
        deductions: Number(deductions),
        netSalary,
        status,
        processedBy: ["PROCESSED", "PAID"].includes(status)
          ? req.user.id
          : undefined,
        processedAt: ["PROCESSED", "PAID"].includes(status)
          ? new Date()
          : undefined,
      },
      include: { employee: true, processor: true },
    });
    return sendSuccess(res, { payroll }, "Payroll created successfully", 201);
  } catch (error) {
    console.error("createPayroll error:", error);
    return sendError(res, "Failed to create payroll", 500);
  }
};

const updatePayrollStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !["DRAFT", "PROCESSED", "PAID"].includes(status)) {
      return sendError(res, "Valid status (DRAFT, PROCESSED, PAID) is required", 400);
    }
    const updated = await prisma.payroll.update({
      where: { id },
      data: {
        status,
        processedBy: req.user.id,
        processedAt: new Date(),
      },
      include: { employee: true, processor: true },
    });
    return sendSuccess(res, { payroll: updated }, "Payroll status updated successfully");
  } catch (error) {
    console.error("updatePayrollStatus error:", error);
    return sendError(res, "Failed to update payroll status", 500);
  }
};

module.exports = {
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
};
