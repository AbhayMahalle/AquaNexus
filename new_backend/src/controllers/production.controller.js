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

    const where = {
      organizationId: req.organizationId,
    };

    if (productId) {
      where.productId = productId;
    }

    if (status && status !== 'ALL') {
      const s = String(status).toUpperCase();
      where.status = s === 'PENDING' ? 'PLANNED' : s;
    }

    if (startDate || endDate) {
      where.productionDate = {};
      if (startDate) where.productionDate.gte = new Date(startDate);
      if (endDate) where.productionDate.lte = new Date(endDate);
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { productionNumber: { contains: search, mode: 'insensitive' } },
            { batchNumber: { contains: search, mode: 'insensitive' } },
            { product: { name: { contains: search, mode: 'insensitive' } } }
          ]
        }
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
      data: formatted,
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

const getProductionStats = async (req, res) => {
  try {
    const where = { organizationId: req.organizationId };

    const [totalBatches, plannedBatches, inProgressBatches, completedBatches, aggregateQty] = await Promise.all([
      prisma.production.count({ where }),
      prisma.production.count({ where: { ...where, status: 'PLANNED' } }),
      prisma.production.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.production.count({ where: { ...where, status: 'COMPLETED' } }),
      prisma.production.aggregate({ where, _sum: { quantity: true } })
    ]);

    const stats = {
      totalBatches,
      plannedBatches,
      inProgressBatches,
      completedBatches,
      totalQuantity: aggregateQty._sum?.quantity || 0
    };

    return sendSuccess(res, { stats, data: stats, ...stats }, 'Production statistics retrieved successfully');
  } catch (error) {
    console.error('getProductionStats error:', error);
    return sendError(res, 'Failed to retrieve production statistics', 500);
  }
};

/**
 * Get production batch details by ID
 */
const getProductionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'stats') {
      return getProductionStats(req, res);
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const where = {
      organizationId: req.organizationId,
      ...(isUuid
        ? { OR: [{ id }, { batchNumber: id }, { productionNumber: id }] }
        : { OR: [{ batchNumber: id }, { productionNumber: id }] })
    };

    const production = await prisma.production.findFirst({
      where,
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

    const totalReceived = (production.goodsReceived || []).reduce((acc, gr) => acc + gr.quantity, 0);

    return sendSuccess(res, {
      ...production,
      production,
      data: production,
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

    const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
    const product = isUuid(productId)
      ? await prisma.product.findFirst({ where: { id: productId, organizationId: req.organizationId } })
      : await prisma.product.findFirst({
          where: {
            organizationId: req.organizationId,
            OR: [{ sku: productId }, { name: productId }]
          }
        });

    if (!product) {
      return sendError(res, 'Product not found in your organization', 400);
    }

    let resolvedStatus = 'PLANNED';
    if (status) {
      const s = String(status).toUpperCase();
      if (s === 'PENDING' || s === 'PLANNED') {
        resolvedStatus = 'PLANNED';
      } else if (['IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(s)) {
        resolvedStatus = s;
      }
    }

    // Auto-generate productionNumber if not provided or ensure uniqueness within organization
    let prodNum = productionNumber;
    if (!prodNum) {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const count = await prisma.production.count({ where: { organizationId: req.organizationId } });
      prodNum = `PRD-${dateStr}-${String(count + 1).padStart(3, '0')}`;
    }
    const existingProdNum = await prisma.production.findFirst({
      where: { organizationId: req.organizationId, productionNumber: prodNum }
    });
    if (existingProdNum) {
      prodNum = `${prodNum}-${Math.floor(Math.random() * 900 + 100)}`;
    }

    let finalBatchNumber = batchNumber || `BATCH-${Date.now()}`;
    const existingBatch = await prisma.production.findFirst({
      where: { organizationId: req.organizationId, batchNumber: finalBatchNumber }
    });
    if (existingBatch) {
      finalBatchNumber = `${finalBatchNumber}-${Math.floor(Math.random() * 900 + 100)}`;
    }

    const createdBy = req.user ? req.user.id : null;
    if (!createdBy) {
      return sendError(res, 'Authenticated user context missing', 401);
    }

    const newProduction = await prisma.production.create({
      data: {
        organizationId: req.organizationId,
        productionNumber: prodNum,
        productId: product.id,
        quantity: qty,
        productionDate: new Date(productionDate),
        status: resolvedStatus,
        batchNumber: finalBatchNumber,
        remarks,
        createdBy
      },
      include: {
        product: true
      }
    });

    return sendSuccess(res, {
      ...newProduction,
      production: newProduction,
      data: newProduction
    }, 'Production record created successfully', 201);
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

    let resolvedStatus = status;
    if (resolvedStatus === 'PENDING') resolvedStatus = 'PLANNED';

    if (!['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].includes(resolvedStatus)) {
      return sendError(res, 'Invalid production status', 400);
    }

    const existingProduction = await prisma.production.findFirst({
      where: { id, organizationId: req.organizationId }
    });
    if (!existingProduction) {
      return sendError(res, 'Production record not found', 404);
    }

    const updatedProduction = await prisma.production.update({
      where: { id },
      data: {
        status: resolvedStatus,
        ...(remarks !== undefined && { remarks })
      },
      include: {
        product: true
      }
    });

    return sendSuccess(res, {
      ...updatedProduction,
      production: updatedProduction,
      data: updatedProduction
    }, `Production status updated to ${resolvedStatus}`);
  } catch (error) {
    console.error('updateProductionStatus error:', error);
    return sendError(res, 'Failed to update production status', 500);
  }
};

module.exports = {
  getProductions,
  getProductionById,
  getProductionStats,
  createProduction,
  updateProductionStatus
};
