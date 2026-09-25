const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get all production batches with search, filters, and pagination
 */
const getProductions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      productId,
      status,
      startDate,
      endDate,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (productId) {
      where.productId = productId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.productionDate = {};
      if (startDate) where.productionDate.gte = new Date(startDate);
      if (endDate) where.productionDate.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { productionNumber: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [productions, total] = await Promise.all([
      prisma.production.findMany({
        where,
        skip,
        take,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              unit: true
            }
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          goodsReceived: {
            select: {
              id: true,
              grnNumber: true,
              quantity: true,
              receivedDate: true
            }
          }
        },
        orderBy: { productionDate: 'desc' }
      }),
      prisma.production.count({ where })
    ]);

    // Attach calculated field totalReceived & remainingQuantity
    const formatted = productions.map(p => {
      const totalReceived = p.goodsReceived.reduce((acc, gr) => acc + gr.quantity, 0);
      return {
        ...p,
        totalReceived,
        remainingQuantity: p.quantity - totalReceived
      };
    });

    return sendSuccess(res, {
      productions: formatted,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Production records retrieved successfully');
  } catch (error) {
    console.error('getProductions error:', error);
    return sendError(res, 'Failed to retrieve production records', 500);
  }
};

/**
 * Get production batch details by ID
 */
const getProductionById = async (req, res) => {
  try {
    const { id } = req.params;

    const production = await prisma.production.findUnique({
      where: { id },
      include: {
        product: true,
        creator: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        goodsReceived: {
          include: {
            receiver: {
              select: { id: true, firstName: true, lastName: true }
            }
          },
          orderBy: { receivedDate: 'desc' }
        }
      }
    });

    if (!production) {
      return sendError(res, 'Production record not found', 404);
    }

    const totalReceived = production.goodsReceived.reduce((acc, gr) => acc + gr.quantity, 0);

    return sendSuccess(res, {
      ...production,
      totalReceived,
      remainingQuantity: production.quantity - totalReceived
    }, 'Production record details retrieved successfully');
  } catch (error) {
    console.error('getProductionById error:', error);
    return sendError(res, 'Failed to retrieve production details', 500);
  }
};

/**
 * Create new production batch
 */
const createProduction = async (req, res) => {
  try {
    const {
      productionNumber,
      productId,
      quantity,
      productionDate,
      batchNumber,
      remarks,
      status = 'PLANNED'
    } = req.body;

    if (!productId || !quantity || !productionDate) {
      return sendError(res, 'productId, quantity, and productionDate are required', 400);
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) {
      return sendError(res, 'Quantity must be a positive integer', 400);
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return sendError(res, 'Product not found', 400);
    }

    // Auto-generate productionNumber if not provided
    let prodNum = productionNumber;
    if (!prodNum) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await prisma.production.count();
      prodNum = `PRD-${dateStr}-${String(count + 1).padStart(3, '0')}`;
    }

    // Determine createdBy user
    const createdBy = req.user ? req.user.id : null;
    if (!createdBy) {
      return sendError(res, 'Authenticated user context missing', 401);
    }

    const newProduction = await prisma.production.create({
      data: {
        productionNumber: prodNum,
        productId,
        quantity: qty,
        productionDate: new Date(productionDate),
        status,
        batchNumber: batchNumber || `BATCH-${Date.now()}`,
        remarks,
        createdBy
      },
      include: {
        product: true
      }
    });

    return sendSuccess(res, newProduction, 'Production record created successfully', 201);
  } catch (error) {
    console.error('createProduction error:', error);
    return sendError(res, 'Failed to create production record', 500);
  }
};

/**
 * Update production status
 */
const updateProductionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (!['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return sendError(res, 'Invalid production status', 400);
    }

    const existingProduction = await prisma.production.findUnique({ where: { id } });
    if (!existingProduction) {
      return sendError(res, 'Production record not found', 404);
    }

    const updatedProduction = await prisma.production.update({
      where: { id },
      data: {
        status,
        ...(remarks !== undefined && { remarks })
      },
      include: {
        product: true
      }
    });

    return sendSuccess(res, updatedProduction, `Production status updated to ${status}`);
  } catch (error) {
    console.error('updateProductionStatus error:', error);
    return sendError(res, 'Failed to update production status', 500);
  }
};

module.exports = {
  getProductions,
  getProductionById,
  createProduction,
  updateProductionStatus
};
