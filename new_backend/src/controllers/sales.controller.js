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
      where: {
        organizationId: req.organizationId,
        ...scopedDistributorWhere(req),
      },
      include: {
        distributor: true,
        saleItems: { include: { product: true } },
        returns: true,
        invoices: true,
      },
      orderBy: { saleDate: "desc" },
    });
    return sendSuccess(res, { sales, data: sales }, "Sales retrieved successfully");
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
    let targetDistributorId = distributorId;
    const ids = getAccessibleDistributorIds(req);
    if (!targetDistributorId && ids && ids.length > 0) {
      targetDistributorId = ids[0];
    }

    if (
      !saleNumber ||
      !targetDistributorId ||
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
    if (ids !== null && !ids.includes(targetDistributorId))
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
      where: { id: { in: productIds }, status: "ACTIVE", organizationId: req.organizationId },
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
      const distributor = await transaction.distributor.findFirst({
        where: { id: targetDistributorId, organizationId: req.organizationId },
      });
      if (!distributor) {
        const error = new Error("Distributor not found in your organization");
        error.statusCode = 400;
        throw error;
      }

      if (orderId) {
        const order = await transaction.order.findFirst({
          where: { id: orderId, organizationId: req.organizationId },
        });
        if (!order) {
          const error = new Error("Order not found in your organization");
          error.statusCode = 400;
          throw error;
        }
      }

      for (const item of saleItems) {
        const stock = await transaction.distributorStock.findUnique({
          where: {
            distributorId_productId: {
              distributorId: targetDistributorId,
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
          organizationId: req.organizationId,
          distributorId: targetDistributorId,
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
              distributorId: targetDistributorId,
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
      where: {
        organizationId: req.organizationId,
        ...scopedDistributorWhere(req),
      },
      include: {
        distributor: true,
        sale: true,
        returnItems: { include: { product: true } },
      },
      orderBy: { returnDate: "desc" },
    });
    return sendSuccess(res, { returns, data: returns }, "Returns retrieved successfully");
  } catch (error) {
    console.error("getReturns error:", error);
    return sendError(res, "Failed to retrieve returns", 500);
  }
};

const createReturn = async (req, res) => {
  try {
    const { returnNumber, distributorId, saleId, returnDate, reason, items } =
      req.body;
    let targetDistributorId = distributorId;
    const ids = getAccessibleDistributorIds(req);
    if (!targetDistributorId && ids && ids.length > 0) {
      targetDistributorId = ids[0];
    }

    if (
      !returnNumber ||
      !targetDistributorId ||
      !returnDate ||
      !Array.isArray(items) ||
      items.length === 0
    )
      return sendError(
        res,
        "Return number, distributor, date, and items are required",
        400,
      );
    if (ids !== null && !ids.includes(targetDistributorId))
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
      const distributor = await transaction.distributor.findFirst({
        where: { id: targetDistributorId, organizationId: req.organizationId },
      });
      if (!distributor) {
        const error = new Error("Distributor not found in your organization");
        error.statusCode = 400;
        throw error;
      }

      if (saleId) {
        const sale = await transaction.sale.findFirst({
          where: { id: saleId, organizationId: req.organizationId },
        });
        if (!sale || sale.distributorId !== targetDistributorId) {
          const error = new Error("Sale does not belong to this distributor or organization");
          error.statusCode = 400;
          throw error;
        }
      }
      const record = await transaction.return.create({
        data: {
          returnNumber,
          organizationId: req.organizationId,
          distributorId: targetDistributorId,
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
              distributorId: targetDistributorId,
              productId: item.productId,
            },
          },
          update: { quantity: { increment: item.quantity } },
          create: {
            distributorId: targetDistributorId,
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

/**
 * Update Return status and manage store inventory synchronization
 * Flow: REQUESTED -> APPROVED -> RECEIVED -> INSPECTED -> COMPLETED / REJECTED / CANCELLED
 * Handles returned/damaged quantities correctly without corrupting inventory.
 */
const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!status) {
      return sendError(res, "status is required", 400);
    }

    const normStatus = status.toUpperCase().replace(/[-\s]/g, "_");
    const validStatuses = [
      "REQUESTED",
      "APPROVED",
      "RECEIVED",
      "INSPECTED",
      "COMPLETED",
      "REJECTED",
      "CANCELLED"
    ];

    if (!validStatuses.includes(normStatus)) {
      return sendError(res, `Invalid status. Allowed: ${validStatuses.join(", ")}`, 400);
    }

    const userId = req.user ? req.user.id : null;

    const result = await prisma.$transaction(async (tx) => {
      const returnRec = await tx.return.findFirst({
        where: { id, organizationId: req.organizationId },
        include: {
          returnItems: { include: { product: true } },
          distributor: true
        }
      });

      if (!returnRec) {
        throw new Error("RETURN_NOT_FOUND");
      }

      // Check if stock has already been restocked into central store inventory for this return
      const existingRestockTx = await tx.stockTransaction.findFirst({
        where: {
          organizationId: req.organizationId,
          referenceId: returnRec.id,
          transactionType: "RETURN"
        }
      });

      const willRestock = ["RECEIVED", "INSPECTED", "COMPLETED"].includes(normStatus);
      const isAlreadyRestocked = !!existingRestockTx;

      if (willRestock && !isAlreadyRestocked) {
        // Restock items in GOOD condition into Central Store Inventory
        for (const item of returnRec.returnItems) {
          if (item.condition === "GOOD" && item.quantity > 0) {
            await tx.inventory.upsert({
              where: { productId: item.productId },
              update: { quantity: { increment: item.quantity } },
              create: {
                organizationId: req.organizationId,
                productId: item.productId,
                quantity: item.quantity,
                reservedQuantity: 0,
                reorderLevel: item.product?.minimumStock || 0
              }
            });

            await tx.stockTransaction.create({
              data: {
                organizationId: req.organizationId,
                productId: item.productId,
                transactionType: "RETURN",
                quantity: item.quantity,
                referenceType: "RETURN",
                referenceId: returnRec.id,
                status: "COMPLETED",
                remarks: `Return #${returnRec.returnNumber} accepted in GOOD condition (Restocked to Central Inventory)`,
                createdBy: userId
              }
            });
          } else if (item.condition === "DAMAGED" && item.quantity > 0) {
            // Damaged goods: log damaged stock transaction without corrupting saleable inventory
            await tx.stockTransaction.create({
              data: {
                organizationId: req.organizationId,
                productId: item.productId,
                transactionType: "DAMAGED",
                quantity: item.quantity,
                status: "REPORTED",
                referenceType: "RETURN_DAMAGED",
                referenceId: returnRec.id,
                remarks: `Return #${returnRec.returnNumber} item received DAMAGED (Quarantined/Scrap)`,
                createdBy: userId
              }
            });
          }
        }
      } else if (isAlreadyRestocked && (normStatus === "REJECTED" || normStatus === "CANCELLED")) {
        // If it was already restocked, but now explicitly rejected/cancelled, revert the store inventory!
        for (const item of returnRec.returnItems) {
          if (item.condition === "GOOD" && item.quantity > 0) {
            await tx.inventory.update({
              where: { productId: item.productId },
              data: { quantity: { decrement: item.quantity } }
            });

            await tx.stockTransaction.create({
              data: {
                organizationId: req.organizationId,
                productId: item.productId,
                transactionType: "ADJUSTMENT",
                quantity: item.quantity,
                referenceType: "RETURN_REVERSAL",
                referenceId: returnRec.id,
                status: "COMPLETED",
                remarks: `Return #${returnRec.returnNumber} marked ${normStatus} (Reversed store inventory: -${item.quantity})`,
                createdBy: userId
              }
            });
          }
        }
      }

      const updatedReturn = await tx.return.update({
        where: { id: returnRec.id },
        data: {
          status: normStatus,
          ...(remarks !== undefined && { reason: remarks || returnRec.reason })
        },
        include: {
          returnItems: { include: { product: true } },
          distributor: true,
          sale: true
        }
      });

      return updatedReturn;
    });

    return sendSuccess(res, { return: result, data: result }, `Return status updated to ${result.status} successfully`);
  } catch (error) {
    console.error("updateReturnStatus error:", error);
    if (error.message === "RETURN_NOT_FOUND") return sendError(res, "Return record not found", 404);
    return sendError(res, "Failed to update return status", 500);
  }
};

module.exports = {
  getSales,
  createSale,
  getReturns,
  createReturn,
  updateReturnStatus
};

