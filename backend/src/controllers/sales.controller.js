const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { getAccessibleDistributorIds } = require("../utils/distributorAccess");

const scopedDistributorWhere = (req) => {
  const ids = getAccessibleDistributorIds(req);
  return ids === null ? {} : { distributorId: { in: ids } };
};

const getSales = async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      where: scopedDistributorWhere(req),
      include: {
        distributor: true,
        saleItems: { include: { product: true } },
        returns: true,
        invoices: true,
      },
      orderBy: { saleDate: "desc" },
    });
    return sendSuccess(res, { sales }, "Sales retrieved successfully");
  } catch (error) {
    console.error("getSales error:", error);
    return sendError(res, "Failed to retrieve sales", 500);
  }
};

const createSale = async (req, res) => {
  try {
    const {
      saleNumber,
      distributorId,
      orderId,
      dispatchId,
      saleDate,
      customerReference,
      items,
      discount = 0,
      tax = 0,
    } = req.body;
    if (
      !saleNumber ||
      !distributorId ||
      !saleDate ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return sendError(
        res,
        "Sale number, distributor, date, and items are required",
        400,
      );
    }
    const ids = getAccessibleDistributorIds(req);
    if (ids !== null && !ids.includes(distributorId))
      return sendError(
        res,
        "You cannot create a sale for this distributor",
        403,
      );
    const productIds = items.map((item) => item.productId);
    if (
      new Set(productIds).size !== productIds.length ||
      items.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      return sendError(
        res,
        "Sale items must contain unique products and positive quantities",
        400,
      );
    }
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
    });
    if (products.length !== productIds.length)
      return sendError(
        res,
        "One or more products were not found or are inactive",
        400,
      );
    const byId = new Map(products.map((product) => [product.id, product]));
    const saleItems = items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: Number(byId.get(item.productId).sellingPrice),
      total: Number(byId.get(item.productId).sellingPrice) * item.quantity,
    }));
    const subtotal = saleItems.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal - Number(discount) + Number(tax);
    if (!Number.isFinite(totalAmount) || totalAmount < 0)
      return sendError(res, "Sale values produce an invalid total", 400);

    const sale = await prisma.$transaction(async (transaction) => {
      for (const item of saleItems) {
        const stock = await transaction.distributorStock.findUnique({
          where: {
            distributorId_productId: {
              distributorId,
              productId: item.productId,
            },
          },
        });
        if (!stock || stock.quantity < item.quantity) {
          const error = new Error(
            `Insufficient distributor stock for product ${item.productId}`,
          );
          error.statusCode = 409;
          throw error;
        }
      }
      const created = await transaction.sale.create({
        data: {
          saleNumber,
          distributorId,
          orderId,
          dispatchId,
          saleDate: new Date(saleDate),
          customerReference,
          subtotal,
          discount: Number(discount),
          tax: Number(tax),
          totalAmount,
          createdBy: req.user.id,
          saleItems: { create: saleItems },
        },
        include: {
          distributor: true,
          saleItems: { include: { product: true } },
        },
      });
      for (const item of saleItems) {
        await transaction.distributorStock.update({
          where: {
            distributorId_productId: {
              distributorId,
              productId: item.productId,
            },
          },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      return created;
    });
    return sendSuccess(res, { sale }, "Sale created successfully", 201);
  } catch (error) {
    if (error.statusCode)
      return sendError(res, error.message, error.statusCode);
    if (error.code === "P2002")
      return sendError(res, "A sale with this number already exists", 409);
    console.error("createSale error:", error);
    return sendError(res, "Failed to create sale", 500);
  }
};

const getReturns = async (req, res) => {
  try {
    const returns = await prisma.return.findMany({
      where: scopedDistributorWhere(req),
      include: {
        distributor: true,
        sale: true,
        returnItems: { include: { product: true } },
      },
      orderBy: { returnDate: "desc" },
    });
    return sendSuccess(res, { returns }, "Returns retrieved successfully");
  } catch (error) {
    console.error("getReturns error:", error);
    return sendError(res, "Failed to retrieve returns", 500);
  }
};

const createReturn = async (req, res) => {
  try {
    const { returnNumber, distributorId, saleId, returnDate, reason, items } =
      req.body;
    if (
      !returnNumber ||
      !distributorId ||
      !returnDate ||
      !Array.isArray(items) ||
      items.length === 0
    )
      return sendError(
        res,
        "Return number, distributor, date, and items are required",
        400,
      );
    const ids = getAccessibleDistributorIds(req);
    if (ids !== null && !ids.includes(distributorId))
      return sendError(
        res,
        "You cannot create a return for this distributor",
        403,
      );
    if (
      items.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0 ||
          !["GOOD", "DAMAGED"].includes(item.condition),
      )
    )
      return sendError(
        res,
        "Return items require positive quantities and a valid condition",
        400,
      );
    const createdReturn = await prisma.$transaction(async (transaction) => {
      if (saleId) {
        const sale = await transaction.sale.findUnique({
          where: { id: saleId },
        });
        if (!sale || sale.distributorId !== distributorId) {
          const error = new Error("Sale does not belong to this distributor");
          error.statusCode = 400;
          throw error;
        }
      }
      const record = await transaction.return.create({
        data: {
          returnNumber,
          distributorId,
          saleId,
          returnDate: new Date(returnDate),
          reason,
          createdBy: req.user.id,
          returnItems: { create: items },
        },
        include: { returnItems: true, distributor: true },
      });
      for (const item of items.filter((entry) => entry.condition === "GOOD"))
        await transaction.distributorStock.upsert({
          where: {
            distributorId_productId: {
              distributorId,
              productId: item.productId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            distributorId,
            productId: item.productId,
            quantity: item.quantity,
          },
        });
      return record;
    });
    return sendSuccess(
      res,
      { return: createdReturn },
      "Return created successfully",
      201,
    );
  } catch (error) {
    if (error.statusCode)
      return sendError(res, error.message, error.statusCode);
    if (error.code === "P2002")
      return sendError(
        res,
        "A return with this number or product already exists",
        409,
      );
    console.error("createReturn error:", error);
    return sendError(res, "Failed to create return", 500);
  }
};

module.exports = { getSales, createSale, getReturns, createReturn };
