const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { getAccessibleDistributorIds } = require("../utils/distributorAccess");

const getRequestedDistributorId = (req, requestedId) => {
  const accessibleIds = getAccessibleDistributorIds(req);
  if (accessibleIds === null) {
    return requestedId;
  }

  if (requestedId && !accessibleIds.includes(requestedId)) {
    return null;
  }

  return requestedId || (accessibleIds.length === 1 ? accessibleIds[0] : null);
};

const getOrders = async (req, res) => {
  try {
    const distributorIds = getAccessibleDistributorIds(req);
    const where =
      distributorIds === null
        ? req.query.distributorId
          ? { distributorId: req.query.distributorId }
          : {}
        : { distributorId: { in: distributorIds } };

    const orders = await prisma.order.findMany({
      where,
      include: {
        distributor: true,
        orderItems: { include: { product: true } },
      },
      orderBy: { orderDate: "desc" },
    });

    return sendSuccess(res, { orders }, "Orders retrieved successfully");
  } catch (error) {
    console.error("getOrders error:", error);
    return sendError(res, "Failed to retrieve orders", 500);
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        distributor: true,
        orderItems: { include: { product: true } },
      },
    });

    if (!order) {
      return sendError(res, "Order not found", 404);
    }

    const accessibleIds = getAccessibleDistributorIds(req);
    if (
      accessibleIds !== null &&
      !accessibleIds.includes(order.distributorId)
    ) {
      return sendError(res, "Order not found", 404);
    }

    return sendSuccess(res, { order }, "Order retrieved successfully");
  } catch (error) {
    console.error("getOrderById error:", error);
    return sendError(res, "Failed to retrieve order", 500);
  }
};

const createOrder = async (req, res) => {
  try {
    const {
      distributorId: requestedDistributorId,
      orderDate,
      items,
      discount = 0,
      tax = 0,
      notes,
    } = req.body;
    const distributorId = getRequestedDistributorId(
      req,
      requestedDistributorId,
    );

    if (
      !distributorId ||
      !orderDate ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return sendError(
        res,
        "Distributor, order date, and at least one item are required",
        400,
      );
    }

    const productIds = items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      return sendError(res, "A product may only appear once in an order", 400);
    }

    if (
      items.some(
        (item) =>
          !item.productId ||
          !Number.isInteger(item.quantity) ||
          item.quantity <= 0,
      )
    ) {
      return sendError(
        res,
        "Each item requires a positive integer quantity and product ID",
        400,
      );
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
    });
    if (products.length !== productIds.length) {
      return sendError(
        res,
        "One or more products were not found or are inactive",
        400,
      );
    }

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );
    const orderItems = items.map((item) => {
      const unitPrice = Number(productsById.get(item.productId).sellingPrice);
      const total = unitPrice * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total,
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    const totalAmount = subtotal - Number(discount) + Number(tax);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return sendError(
        res,
        "Discount and tax produce an invalid order total",
        400,
      );
    }

    const order = await prisma.$transaction(async (transaction) =>
      transaction.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          distributorId,
          orderDate: new Date(orderDate),
          subtotal,
          discount: Number(discount),
          tax: Number(tax),
          totalAmount,
          notes,
          createdBy: req.user.id,
          orderItems: { create: orderItems },
        },
        include: {
          distributor: true,
          orderItems: { include: { product: true } },
        },
      }),
    );

    return sendSuccess(res, { order }, "Order created successfully", 201);
  } catch (error) {
    console.error("createOrder error:", error);
    return sendError(res, "Failed to create order", 500);
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
};
