const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get all products with search, filters, and inventory levels
 */
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      status
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {
      organizationId: req.organizationId,
    };

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        include: {
          inventory: {
            select: {
              id: true,
              quantity: true,
              reservedQuantity: true,
              reorderLevel: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    return sendSuccess(res, {
      products,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Products retrieved successfully');
  } catch (error) {
    console.error('getProducts error:', error);
    return sendError(res, 'Failed to retrieve products', 500);
  }
};

/**
 * Get product by ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, organizationId: req.organizationId },
      include: {
        inventory: true,
        productions: {
          take: 5,
          orderBy: { productionDate: 'desc' }
        }
      }
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, product, 'Product details retrieved successfully');
  } catch (error) {
    console.error('getProductById error:', error);
    return sendError(res, 'Failed to retrieve product details', 500);
  }
};

/**
 * Create a new product and initialize central inventory record
 */
const createProduct = async (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      category,
      unit = 'Bottle',
      sellingPrice,
      costPrice,
      minimumStock = 0,
      status = 'ACTIVE'
    } = req.body;

    if (!sku || !name || sellingPrice === undefined || costPrice === undefined) {
      return sendError(res, 'SKU, name, sellingPrice, and costPrice are required', 400);
    }

    const existingSKU = await prisma.product.findFirst({
      where: {
        organizationId: req.organizationId,
        sku
      }
    });
    if (existingSKU) {
      return sendError(res, `Product with SKU '${sku}' already exists in your organization`, 400);
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          organizationId: req.organizationId,
          sku,
          name,
          description,
          category,
          unit,
          sellingPrice: parseFloat(sellingPrice),
          costPrice: parseFloat(costPrice),
          minimumStock: parseInt(minimumStock),
          status
        }
      });

      // Initialize inventory record for this product and organization
      await tx.inventory.create({
        data: {
          organizationId: req.organizationId,
          productId: newProduct.id,
          quantity: 0,
          reservedQuantity: 0,
          reorderLevel: parseInt(minimumStock)
        }
      });

      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: { inventory: true }
      });
    });

    return sendSuccess(res, product, 'Product created successfully', 201);
  } catch (error) {
    console.error('createProduct error:', error);
    return sendError(res, 'Failed to create product', 500);
  }
};

/**
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      unit,
      sellingPrice,
      costPrice,
      minimumStock,
      status
    } = req.body;

    const existingProduct = await prisma.product.findFirst({
      where: { id, organizationId: req.organizationId }
    });
    if (!existingProduct) {
      return sendError(res, 'Product not found', 404);
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(unit && { unit }),
        ...(sellingPrice !== undefined && { sellingPrice: parseFloat(sellingPrice) }),
        ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
        ...(minimumStock !== undefined && { minimumStock: parseInt(minimumStock) }),
        ...(status && { status })
      },
      include: {
        inventory: true
      }
    });

    // Also update inventory reorder level if minimum stock changed
    if (minimumStock !== undefined) {
      await prisma.inventory.updateMany({
        where: { productId: id, organizationId: req.organizationId },
        data: { reorderLevel: parseInt(minimumStock) }
      });
    }

    return sendSuccess(res, updatedProduct, 'Product updated successfully');
  } catch (error) {
    console.error('updateProduct error:', error);
    return sendError(res, 'Failed to update product', 500);
  }
};

/**
 * Delete or deactivate product
 * If product is referenced by inventory (qty > 0), stock transactions, orders, dispatches,
 * sales, goods received, purchase requisitions, or purchase orders, deactivate it (status = INACTIVE).
 * If completely unreferenced and 0 inventory, permanently delete.
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findFirst({
      where: { id, organizationId: req.organizationId },
      include: {
        inventory: true
      }
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    // Check references
    const [
      txCount,
      orderItemCount,
      dispatchItemCount,
      saleItemCount,
      goodsReceivedCount,
      poItemCount,
      prItemCount,
      productionCount
    ] = await Promise.all([
      prisma.stockTransaction.count({ where: { productId: id } }),
      prisma.orderItem.count({ where: { productId: id } }),
      prisma.dispatchItem.count({ where: { productId: id } }),
      prisma.saleItem.count({ where: { productId: id } }),
      prisma.goodsReceived.count({ where: { productId: id } }),
      prisma.purchaseOrderItem.count({ where: { productId: id } }),
      prisma.purchaseRequisitionItem.count({ where: { productId: id } }),
      prisma.production.count({ where: { productId: id } })
    ]);

    const hasStock = product.inventory && product.inventory.quantity > 0;
    const hasReferences = (
      hasStock ||
      txCount > 0 ||
      orderItemCount > 0 ||
      dispatchItemCount > 0 ||
      saleItemCount > 0 ||
      goodsReceivedCount > 0 ||
      poItemCount > 0 ||
      prItemCount > 0 ||
      productionCount > 0
    );

    if (hasReferences) {
      // Soft-delete / deactivate product to preserve historical integrity
      const updated = await prisma.product.update({
        where: { id },
        data: { status: 'INACTIVE' },
        include: { inventory: true }
      });

      const reasons = [];
      if (hasStock) reasons.push(`current stock is ${product.inventory.quantity}`);
      if (txCount > 0) reasons.push(`${txCount} stock transaction(s)`);
      if (orderItemCount > 0) reasons.push(`${orderItemCount} order(s)`);
      if (dispatchItemCount > 0) reasons.push(`${dispatchItemCount} dispatch(es)`);
      if (goodsReceivedCount > 0) reasons.push(`${goodsReceivedCount} goods received record(s)`);
      if (productionCount > 0) reasons.push(`${productionCount} production batch(es)`);

      return sendSuccess(res, {
        product: updated,
        action: 'DEACTIVATED',
        referenced: true,
        reasons
      }, `Product is referenced in system records (${reasons.join(', ')}). Product has been safely deactivated (status: INACTIVE) to preserve database integrity.`);
    }

    // Unreferenced - safe to delete permanently
    await prisma.$transaction(async (tx) => {
      await tx.inventory.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return sendSuccess(res, { action: 'DELETED', id }, 'Product permanently deleted successfully');
  } catch (error) {
    console.error('deleteProduct error:', error);
    return sendError(res, 'Failed to delete product', 500);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};

