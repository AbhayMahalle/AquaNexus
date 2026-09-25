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

    const where = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
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

    const product = await prisma.product.findUnique({
      where: { id },
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

    const existingSKU = await prisma.product.findUnique({ where: { sku } });
    if (existingSKU) {
      return sendError(res, `Product with SKU '${sku}' already exists`, 400);
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
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

      // Initialize inventory record
      await tx.inventory.create({
        data: {
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

    const existingProduct = await prisma.product.findUnique({ where: { id } });
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
        where: { productId: id },
        data: { reorderLevel: parseInt(minimumStock) }
      });
    }

    return sendSuccess(res, updatedProduct, 'Product updated successfully');
  } catch (error) {
    console.error('updateProduct error:', error);
    return sendError(res, 'Failed to update product', 500);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct
};
