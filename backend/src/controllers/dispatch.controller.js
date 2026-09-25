const prisma = require("../config/db");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { getAccessibleDistributorIds } = require("../utils/distributorAccess");

const getDispatches = async (req, res) => {
  try {
    const distributorIds = getAccessibleDistributorIds(req);
    const where =
      distributorIds === null ? {} : { distributorId: { in: distributorIds } };

    const dispatches = await prisma.dispatch.findMany({
      where,
      include: {
        distributor: true,
        order: true,
        dispatchItems: { include: { product: true } },
      },
      orderBy: { dispatchDate: "desc" },
    });

    return sendSuccess(
      res,
      { dispatches },
      "Dispatches retrieved successfully",
    );
  } catch (error) {
    console.error("getDispatches error:", error);
    return sendError(res, "Failed to retrieve dispatches", 500);
  }
};

const createDispatch = async (req, res) => {
  try {
    const { orderId, distributorId, dispatchDate, remarks, items } = req.body;

    if (
      !distributorId ||
      !dispatchDate ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return sendError(
        res,
        "Distributor, dispatch date, and at least one item are required",
        400,
      );
    }

    const productIds = items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      return sendError(
        res,
        "A product may only appear once in a dispatch",
        400,
      );
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
        "Each dispatch item requires a positive integer quantity and product ID",
        400,
      );
    }

    const accessibleIds = getAccessibleDistributorIds(req);
    if (accessibleIds !== null && !accessibleIds.includes(distributorId)) {
      return sendError(res, "You cannot dispatch to this distributor", 403);
    }

    const dispatch = await prisma.$transaction(async (transaction) => {
      const distributor = await transaction.distributor.findUnique({
        where: { id: distributorId },
      });
      if (!distributor) {
        const error = new Error("Distributor not found");
        error.statusCode = 400;
        throw error;
      }

      if (orderId) {
        const order = await transaction.order.findUnique({
          where: { id: orderId },
        });
        if (!order || order.distributorId !== distributorId) {
          const error = new Error("Order does not belong to this distributor");
          error.statusCode = 400;
          throw error;
        }
        if (["CANCELLED", "DELIVERED"].includes(order.status)) {
          const error = new Error("This order cannot be dispatched");
          error.statusCode = 400;
          throw error;
        }
      }

      const inventories = await transaction.inventory.findMany({
        where: { productId: { in: productIds } },
      });
      const inventoryByProductId = new Map(
        inventories.map((inventory) => [inventory.productId, inventory]),
      );

      for (const item of items) {
        const inventory = inventoryByProductId.get(item.productId);
        const availableQuantity = inventory
          ? inventory.quantity - inventory.reservedQuantity
          : 0;
        if (!inventory || item.quantity > availableQuantity) {
          const error = new Error(
            `Insufficient central stock for product ${item.productId}`,
          );
          error.statusCode = 409;
          throw error;
        }
      }

      const createdDispatch = await transaction.dispatch.create({
        data: {
          dispatchNumber: `DSP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          orderId,
          distributorId,
          dispatchDate: new Date(dispatchDate),
          status: "DISPATCHED",
          createdBy: req.user.id,
          remarks,
          dispatchItems: { create: items },
        },
        include: {
          distributor: true,
          order: true,
          dispatchItems: { include: { product: true } },
        },
      });

      for (const item of items) {
        await transaction.inventory.update({
          where: { productId: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });

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

        await transaction.stockTransaction.create({
          data: {
            productId: item.productId,
            transactionType: "DISPATCH",
            quantity: item.quantity,
            referenceType: "DISPATCH",
            referenceId: createdDispatch.id,
            createdBy: req.user.id,
          },
        });
      }

      if (orderId) {
        await transaction.order.update({
          where: { id: orderId },
          data: { status: "DISPATCHED" },
        });
      }

      return createdDispatch;
    });

    return sendSuccess(res, { dispatch }, "Dispatch created successfully", 201);
  } catch (error) {
    if (error.statusCode) {
      return sendError(res, error.message, error.statusCode);
    }
    console.error("createDispatch error:", error);
    return sendError(res, "Failed to create dispatch", 500);
  }
};

module.exports = {
  getDispatches,
  createDispatch,
};
