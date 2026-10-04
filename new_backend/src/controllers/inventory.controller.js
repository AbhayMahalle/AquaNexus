const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get central store inventory for all products
 */
const getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, lowStockOnly } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const productWhere = {
      organizationId: req.organizationId,
    };
    if (category) productWhere.category = category;
    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const inventoryList = await prisma.inventory.findMany({
      where: {
        organizationId: req.organizationId,
        product: productWhere
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            unit: true,
            minimumStock: true,
            status: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    let items = inventoryList.map(inv => ({
      ...inv,
      availableQuantity: inv.quantity - inv.reservedQuantity,
      isLowStock: inv.quantity <= inv.reorderLevel
    }));

    if (lowStockOnly === 'true') {
      items = items.filter(item => item.isLowStock);
    }

    const total = items.length;
    const paginatedItems = items.slice(skip, skip + take);

    return sendSuccess(res, {
      inventory: paginatedItems,
      data: paginatedItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Inventory retrieved successfully');
  } catch (error) {
    console.error('getInventory error:', error);
    return sendError(res, 'Failed to retrieve inventory', 500);
  }
};

/**
 * Get low stock alerts
 */
const getLowStockAlerts = async (req, res) => {
  try {
    const inventoryList = await prisma.inventory.findMany({
      where: {
        organizationId: req.organizationId
      },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            category: true,
            unit: true,
            minimumStock: true
          }
        }
      }
    });

    const lowStockItems = inventoryList
      .filter(inv => inv.quantity <= inv.reorderLevel || inv.quantity <= inv.product.minimumStock)
      .map(inv => ({
        ...inv,
        availableQuantity: inv.quantity - inv.reservedQuantity,
        shortage: inv.reorderLevel - inv.quantity
      }));

    return sendSuccess(res, lowStockItems, 'Low stock alerts retrieved successfully');
  } catch (error) {
    console.error('getLowStockAlerts error:', error);
    return sendError(res, 'Failed to retrieve low stock alerts', 500);
  }
};

/**
 * Get stock movement transaction history
 */
const getStockTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      productId,
      transactionType,
      startDate,
      endDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      organizationId: req.organizationId
    };

    if (productId) where.productId = productId;
    if (transactionType) where.transactionType = transactionType;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.stockTransaction.findMany({
        where,
        skip,
        take,
        include: {
          product: {
            select: { id: true, sku: true, name: true, unit: true }
          },
          creator: {
            select: { id: true, firstName: true, lastName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.stockTransaction.count({ where })
    ]);

    const enrichedTransactions = transactions.map((tx) => {
      const refInRemarks = tx.remarks?.match(/\[Ref:\s*([^\]]+)\]/)?.[1];
      return {
        ...tx,
        referenceId: tx.referenceId || refInRemarks || null
      };
    });

    return sendSuccess(res, {
      transactions: enrichedTransactions,
      data: enrichedTransactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Stock transactions retrieved successfully');
  } catch (error) {
    console.error('getStockTransactions error:', error);
    return sendError(res, 'Failed to retrieve stock transactions', 500);
  }
};

/**
 * Store receives goods from production (Atomic Prisma Transaction)
 */
const receiveGoods = async (req, res) => {
  try {
    const {
      productionId,
      productId,
      quantity,
      receivedDate,
      grnNumber,
      remarks
    } = req.body;

    if (!productionId || !productId || !quantity) {
      return sendError(res, 'productionId, productId, and quantity are required', 400);
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return sendError(res, 'Quantity must be a positive integer', 400);
    }

    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return sendError(res, 'Authenticated user context required', 401);
    }

    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify production batch belongs to caller's organization
      const production = isUuid(productionId)
        ? await tx.production.findFirst({
            where: { id: productionId, organizationId: req.organizationId },
            include: { goodsReceived: true }
          })
        : await tx.production.findFirst({
            where: {
              organizationId: req.organizationId,
              OR: [{ batchNumber: productionId }, { productionNumber: productionId }]
            },
            include: { goodsReceived: true }
          });

      if (!production) {
        throw new Error('PRODUCTION_NOT_FOUND');
      }

      let product = null;
      if (productId) {
        product = isUuid(productId)
          ? await tx.product.findFirst({ where: { id: productId, organizationId: req.organizationId } })
          : await tx.product.findFirst({
              where: {
                organizationId: req.organizationId,
                OR: [{ sku: productId }, { name: productId }]
              }
            });
      }
      if (!product && production.productId) {
        product = await tx.product.findFirst({
          where: { id: production.productId, organizationId: req.organizationId }
        });
      }

      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      if (production.productId !== product.id) {
        throw new Error('PRODUCT_MISMATCH');
      }

      const alreadyReceived = (production.goodsReceived || []).reduce((sum, gr) => sum + gr.quantity, 0);
      const remainingAllowed = production.quantity - alreadyReceived;

      if (remainingAllowed > 0 && qty > remainingAllowed) {
        throw new Error(`OVER_RECEIPT_EXCEEDED:${remainingAllowed}`);
      }

      // 2. Auto-generate GRN number if not provided or ensure uniqueness within organization
      let grnNum = grnNumber;
      if (!grnNum) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await tx.goodsReceived.count({ where: { organizationId: req.organizationId } });
        grnNum = `GRN-${dateStr}-${String(count + 1).padStart(3, '0')}`;
      }
      const existingGrn = await tx.goodsReceived.findFirst({
        where: { organizationId: req.organizationId, grnNumber: grnNum }
      });
      if (existingGrn) {
        grnNum = `${grnNum}-${Math.floor(Math.random() * 900 + 100)}`;
      }

      // 3. Create GoodsReceived record with organizationId
      const goodsReceived = await tx.goodsReceived.create({
        data: {
          organizationId: req.organizationId,
          grnNumber: grnNum,
          productId: product.id,
          productionId: production.id,
          quantity: qty,
          receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
          receivedBy: userId,
          remarks
        }
      });

      // 4. Create StockTransaction audit log with organizationId
      await tx.stockTransaction.create({
        data: {
          organizationId: req.organizationId,
          productId: product.id,
          transactionType: 'PRODUCTION_RECEIPT',
          quantity: qty,
          referenceType: 'GoodsReceived',
          referenceId: goodsReceived.id,
          remarks: remarks || `Goods received via ${grnNum}`,
          createdBy: userId
        }
      });

      // 5. Update or Create Inventory
      const existingInventory = await tx.inventory.findUnique({
        where: { productId: product.id }
      });

      let updatedInventory;
      if (existingInventory) {
        updatedInventory = await tx.inventory.update({
          where: { productId: product.id },
          data: {
            quantity: { increment: qty }
          }
        });
      } else {
        updatedInventory = await tx.inventory.create({
          data: {
            organizationId: req.organizationId,
            productId: product.id,
            quantity: qty,
            reservedQuantity: 0,
            reorderLevel: product.minimumStock || 0
          }
        });
      }

      // 6. Auto-update production status to COMPLETED if fully received
      if (alreadyReceived + qty >= production.quantity) {
        await tx.production.update({
          where: { id: production.id },
          data: { status: 'COMPLETED' }
        });
      }

      return {
        goodsReceived,
        data: goodsReceived,
        inventory: updatedInventory
      };
    });

    return sendSuccess(res, result, 'Goods received and inventory updated successfully', 201);
  } catch (error) {
    console.error('receiveGoods error:', error);

    if (error.message === 'PRODUCTION_NOT_FOUND') {
      return sendError(res, 'Production record not found', 404);
    }
    if (error.message === 'PRODUCT_MISMATCH') {
      return sendError(res, 'Product ID does not match production record product ID', 400);
    }
    if (error.message.startsWith('OVER_RECEIPT_EXCEEDED:')) {
      const allowed = error.message.split(':')[1];
      return sendError(res, `Quantity exceeds remaining production quantity allowed (${allowed})`, 400);
    }

    return sendError(res, 'Failed to process goods receipt', 500);
  }
};

/**
 * Record manual stock transaction (STOCK_IN, STOCK_OUT, DAMAGED, RETURN, ADJUSTMENT)
 */
const createStockTransaction = async (req, res) => {
  try {
    const {
      productId,
      transactionType,
      quantity,
      referenceType,
      referenceId,
      remarks
    } = req.body;

    if (!productId || !transactionType || quantity === undefined) {
      return sendError(res, 'productId, transactionType, and quantity are required', 400);
    }

    const validTypes = ['PRODUCTION_RECEIPT', 'STOCK_IN', 'STOCK_OUT', 'DISPATCH', 'RETURN', 'DAMAGED', 'ADJUSTMENT'];
    if (!validTypes.includes(transactionType)) {
      return sendError(res, `Invalid transaction type. Allowed: ${validTypes.join(', ')}`, 400);
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return sendError(res, 'Quantity must be a positive integer', 400);
    }

    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return sendError(res, 'Authenticated user context required', 401);
    }

    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const result = await prisma.$transaction(async (tx) => {
      const product = isUuid(productId)
        ? await tx.product.findFirst({ where: { id: productId, organizationId: req.organizationId } })
        : await tx.product.findFirst({
            where: {
              organizationId: req.organizationId,
              OR: [{ sku: productId }, { name: productId }]
            }
          });

      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      let inventory = await tx.inventory.findUnique({ where: { productId: product.id } });
      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            organizationId: req.organizationId,
            productId: product.id,
            quantity: 0,
            reservedQuantity: 0,
            reorderLevel: product.minimumStock
          }
        });
      }

      // Check stock sufficiency for decreasing operations
      const isDecreasing = ['STOCK_OUT', 'DISPATCH', 'DAMAGED'].includes(transactionType);
      if (isDecreasing && inventory.quantity < qty) {
        throw new Error(`INSUFFICIENT_STOCK:${inventory.quantity}`);
      }

      let validReferenceUuid = null;
      let resolvedRemarks = remarks || '';

      if (referenceId) {
        if (isUuid(referenceId)) {
          validReferenceUuid = referenceId;
        } else {
          if (!resolvedRemarks.includes(`[Ref: ${referenceId}]`)) {
            resolvedRemarks = resolvedRemarks ? `[Ref: ${referenceId}] ${resolvedRemarks}` : `[Ref: ${referenceId}]`;
          }
        }
      }

      // Record transaction log with organizationId
      const transaction = await tx.stockTransaction.create({
        data: {
          organizationId: req.organizationId,
          productId: product.id,
          transactionType,
          quantity: qty,
          referenceType,
          referenceId: validReferenceUuid,
          remarks: resolvedRemarks,
          createdBy: userId
        }
      });

      // Update inventory quantity
      const delta = isDecreasing ? -qty : qty;
      const updatedInventory = await tx.inventory.update({
        where: { productId: product.id },
        data: {
          quantity: { increment: delta }
        }
      });

      const responseTx = {
        ...transaction,
        referenceId: referenceId || transaction.referenceId
      };

      return {
        transaction: responseTx,
        data: responseTx,
        inventory: updatedInventory
      };
    });

    return sendSuccess(res, result, `Stock transaction (${transactionType}) recorded successfully`, 201);
  } catch (error) {
    console.error('createStockTransaction error:', error);

    if (error.message === 'PRODUCT_NOT_FOUND') {
      return sendError(res, 'Product not found in your organization', 404);
    }
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      const current = error.message.split(':')[1];
      return sendError(res, `Insufficient stock available (Current: ${current})`, 400);
    }

    return sendError(res, 'Failed to record stock transaction', 500);
  }
};

const getGoodsReceived = async (req, res) => {
  try {
    const { page = 1, limit = 50, productId, productionId, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      organizationId: req.organizationId
    };
    if (productId) where.productId = productId;
    if (productionId) where.productionId = productionId;
    if (search) {
      where.AND = [
        {
          OR: [
            { grnNumber: { contains: search, mode: 'insensitive' } },
            { product: { name: { contains: search, mode: 'insensitive' } } },
            { product: { sku: { contains: search, mode: 'insensitive' } } },
            { remarks: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const [goodsReceived, total] = await Promise.all([
      prisma.goodsReceived.findMany({
        where,
        skip,
        take,
        include: {
          product: true,
          production: true,
          receiver: {
            select: { id: true, firstName: true, lastName: true, username: true }
          }
        },
        orderBy: { receivedDate: 'desc' }
      }),
      prisma.goodsReceived.count({ where })
    ]);

    return sendSuccess(res, {
      goodsReceived,
      data: goodsReceived,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Goods received records retrieved successfully');
  } catch (error) {
    console.error('getGoodsReceived error:', error);
    return sendError(res, 'Failed to retrieve goods received records', 500);
  }
};

module.exports = {
  getInventory,
  getLowStockAlerts,
  getStockTransactions,
  receiveGoods,
  getGoodsReceived,
  createStockTransaction
};
