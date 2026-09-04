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

    const productWhere = {};
    if (category) productWhere.category = category;
    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ];
    }

    const inventoryList = await prisma.inventory.findMany({
      where: {
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

    const where = {};

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

    return sendSuccess(res, {
      transactions,
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

    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify production batch
      const production = await tx.production.findUnique({
        where: { id: productionId },
        include: { goodsReceived: true }
      });

      if (!production) {
        throw new Error('PRODUCTION_NOT_FOUND');
      }

      if (production.productId !== productId) {
        throw new Error('PRODUCT_MISMATCH');
      }

      const alreadyReceived = production.goodsReceived.reduce((sum, gr) => sum + gr.quantity, 0);
      const remainingAllowed = production.quantity - alreadyReceived;

      if (qty > remainingAllowed) {
        throw new Error(`OVER_RECEIPT_EXCEEDED:${remainingAllowed}`);
      }

      // 2. Auto-generate GRN number if not provided
      let grnNum = grnNumber;
      if (!grnNum) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const count = await tx.goodsReceived.count();
        grnNum = `GRN-${dateStr}-${String(count + 1).padStart(3, '0')}`;
      }

      // 3. Create GoodsReceived record
      const goodsReceived = await tx.goodsReceived.create({
        data: {
          grnNumber: grnNum,
          productId,
          productionId,
          quantity: qty,
          receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
          receivedBy: userId,
          remarks
        }
      });

      // 4. Create StockTransaction audit log
      await tx.stockTransaction.create({
        data: {
          productId,
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
        where: { productId }
      });

      let updatedInventory;
      if (existingInventory) {
        updatedInventory = await tx.inventory.update({
          where: { productId },
          data: {
            quantity: { increment: qty }
          }
        });
      } else {
        const product = await tx.product.findUnique({ where: { id: productId } });
        updatedInventory = await tx.inventory.create({
          data: {
            productId,
            quantity: qty,
            reservedQuantity: 0,
            reorderLevel: product ? product.minimumStock : 0
          }
        });
      }

      // 6. Auto-update production status to COMPLETED if fully received
      if (alreadyReceived + qty >= production.quantity) {
        await tx.production.update({
          where: { id: productionId },
          data: { status: 'COMPLETED' }
        });
      }

      return {
        goodsReceived,
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

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) {
        throw new Error('PRODUCT_NOT_FOUND');
      }

      let inventory = await tx.inventory.findUnique({ where: { productId } });
      if (!inventory) {
        inventory = await tx.inventory.create({
          data: {
            productId,
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

      // Record transaction log
      const transaction = await tx.stockTransaction.create({
        data: {
          productId,
          transactionType,
          quantity: qty,
          referenceType,
          referenceId,
          remarks,
          createdBy: userId
        }
      });

      // Update inventory quantity
      const delta = isDecreasing ? -qty : qty;
      const updatedInventory = await tx.inventory.update({
        where: { productId },
        data: {
          quantity: { increment: delta }
        }
      });

      return {
        transaction,
        inventory: updatedInventory
      };
    });

    return sendSuccess(res, result, `Stock transaction (${transactionType}) recorded successfully`, 201);
  } catch (error) {
    console.error('createStockTransaction error:', error);

    if (error.message === 'PRODUCT_NOT_FOUND') {
      return sendError(res, 'Product not found', 404);
    }
    if (error.message.startsWith('INSUFFICIENT_STOCK:')) {
      const current = error.message.split(':')[1];
      return sendError(res, `Insufficient stock available (Current: ${current})`, 400);
    }

    return sendError(res, 'Failed to record stock transaction', 500);
  }
};

module.exports = {
  getInventory,
  getLowStockAlerts,
  getStockTransactions,
  receiveGoods,
  createStockTransaction
};
