const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { getAccessibleDistributorIds } = require("../utils/distributorAccess");

const getInvoiceWhere = (req) => {
  const distributorIds = getAccessibleDistributorIds(req);
  const base = { organizationId: req.organizationId };
  if (distributorIds === null) {
    return req.query.distributorId
      ? { ...base, distributorId: req.query.distributorId }
      : base;
  }
  return { ...base, distributorId: { in: distributorIds } };
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

    const formatted = invoices.map(formatInvoice);
    return sendSuccess(
      res,
      { invoices: formatted, data: formatted },
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

    const distributor = await prisma.distributor.findFirst({
      where: { id: distributorId, organizationId: req.organizationId },
    });
    if (!distributor) {
      return sendError(res, "Distributor not found in your organization", 400);
    }

    if (orderId) {
      const order = await prisma.order.findFirst({
        where: { id: orderId, organizationId: req.organizationId },
      });
      if (!order) {
        return sendError(res, "Order not found in your organization", 400);
      }
    }

    if (saleId) {
      const sale = await prisma.sale.findFirst({
        where: { id: saleId, organizationId: req.organizationId },
      });
      if (!sale) {
        return sendError(res, "Sale not found in your organization", 400);
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        organizationId: req.organizationId,
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
      where: { organizationId: req.organizationId, invoice: invoiceWhere },
      include: { invoice: true },
      orderBy: { paymentDate: "desc" },
    });

    return sendSuccess(res, { payments, data: payments }, "Payments retrieved successfully");
  } catch (error) {
    console.error("getPayments error:", error);
    return sendError(res, "Failed to retrieve payments", 500);
  }
};

const createPayment = async (req, res) => {
  try {
    const {
      paymentNumber,
      invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      referenceNumber,
      remarks,
    } = req.body;

    if (
      !paymentNumber ||
      !invoiceId ||
      amount === undefined ||
      !paymentDate ||
      !paymentMethod
    ) {
      return sendError(
        res,
        "Payment number, invoice, amount, date, and method are required",
        400,
      );
    }
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return sendError(res, "Payment amount must be greater than zero", 400);
    }

    const payment = await prisma.$transaction(async (transaction) => {
      const invoice = await transaction.invoice.findFirst({
        where: { id: invoiceId, organizationId: req.organizationId },
        include: { payments: true },
      });
      if (!invoice) {
        const error = new Error("Invoice not found in your organization");
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
          organizationId: req.organizationId,
          invoiceId,
          amount: Number(amount),
          paymentDate: new Date(paymentDate),
          paymentMethod,
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
      where: { organizationId: req.organizationId },
      include: { supplier: true, creator: true, approver: true },
      orderBy: { expenseDate: "desc" },
    });
    return sendSuccess(res, { expenses, data: expenses }, "Expenses retrieved successfully");
  } catch (error) {
    console.error("getExpenses error:", error);
    return sendError(res, "Failed to retrieve expenses", 500);
  }
};

const createExpense = async (req, res) => {
  try {
    const {
      expenseNumber,
      category,
      amount,
      expenseDate,
      description,
      supplierId,
    } = req.body;
    if (!expenseNumber || !category || amount === undefined || !expenseDate) {
      return sendError(
        res,
        "Expense number, category, amount, and date are required",
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

    if (supplierId) {
      const supplier = await prisma.supplier.findFirst({
        where: { id: supplierId, organizationId: req.organizationId },
      });
      if (!supplier) {
        return sendError(res, "Supplier not found in your organization", 400);
      }
    }

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        organizationId: req.organizationId,
        category,
        amount: Number(amount),
        expenseDate: parsedDate,
        description,
        supplierId: supplierId ? supplierId : null,
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
      where: { organizationId: req.organizationId },
      include: { employee: true, processor: true },
      orderBy: { payPeriodStart: "desc" },
    });
    return sendSuccess(res, { payroll, data: payroll }, "Payroll retrieved successfully");
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

    let empId = employeeId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId);
    const emp = await prisma.employee.findFirst({
      where: isUuid
        ? { OR: [{ id: employeeId }, { employeeCode: employeeId }], organizationId: req.organizationId }
        : { employeeCode: employeeId, organizationId: req.organizationId },
    });
    if (!emp) {
      return sendError(res, "Employee not found in your organization", 404);
    }
    empId = emp.id;

    const payroll = await prisma.payroll.create({
      data: {
        organizationId: req.organizationId,
        employeeId: empId,
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
    return sendSuccess(res, { payroll, data: payroll }, "Payroll created successfully", 201);
  } catch (error) {
    console.error("createPayroll error:", error);
    return sendError(res, "Failed to create payroll", 500);
  }
};

const updatePayroll = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, basicSalary, overtimeAmount, deductions } = req.body;

    const existing = await prisma.payroll.findFirst({
      where: { id, organizationId: req.organizationId },
    });
    if (!existing) {
      return sendError(res, "Payroll record not found in your organization", 404);
    }

    const data = {};
    if (status) {
      data.status = status;
      if (["PROCESSED", "PAID"].includes(status)) {
        data.processedBy = req.user.id;
        data.processedAt = new Date();
      }
    }

    const bSalary = basicSalary !== undefined ? Number(basicSalary) : Number(existing.basicSalary);
    const otAmount = overtimeAmount !== undefined ? Number(overtimeAmount) : Number(existing.overtimeAmount);
    const ded = deductions !== undefined ? Number(deductions) : Number(existing.deductions);

    if (basicSalary !== undefined || overtimeAmount !== undefined || deductions !== undefined) {
      data.basicSalary = bSalary;
      data.overtimeAmount = otAmount;
      data.deductions = ded;
      data.netSalary = bSalary + otAmount - ded;
    }

    const updated = await prisma.payroll.update({
      where: { id },
      data,
      include: { employee: true, processor: true },
    });

    return sendSuccess(res, { payroll: updated, data: updated }, "Payroll updated successfully");
  } catch (error) {
    console.error("updatePayroll error:", error);
    return sendError(res, "Failed to update payroll", 500);
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
  updatePayroll,
};
