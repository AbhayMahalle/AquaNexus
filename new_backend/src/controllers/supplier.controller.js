const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const auditService = require('../services/audit.service');

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return sendSuccess(res, 'Suppliers fetched successfully', suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return sendError(res, 'Failed to fetch suppliers', 500);
  }
};

const createSupplier = async (req, res) => {
  try {
    const { supplierCode, name, email, phone, address, status } = req.body;
    const newSupplier = await prisma.supplier.create({
      data: {
        supplierCode,
        name,
        email,
        phone,
        address,
        status: status || 'ACTIVE'
      }
    });

    await auditService.logAction(req.user.id, 'CREATE', 'SUPPLIER', newSupplier.id, {}, newSupplier, req);

    return sendSuccess(res, 'Supplier created successfully', newSupplier, 201);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return sendError(res, 'Failed to create supplier', 500);
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });
    if (!oldSupplier) return sendError(res, 'Supplier not found', 404);

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: updates
    });

    await auditService.logAction(req.user.id, 'UPDATE', 'SUPPLIER', updatedSupplier.id, oldSupplier, updatedSupplier, req);

    return sendSuccess(res, 'Supplier updated successfully', updatedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return sendError(res, 'Failed to update supplier', 500);
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const oldSupplier = await prisma.supplier.findUnique({ where: { id } });
    if (!oldSupplier) return sendError(res, 'Supplier not found', 404);
    
    await prisma.supplier.delete({ where: { id } });
    
    await auditService.logAction(req.user.id, 'DELETE', 'SUPPLIER', id, oldSupplier, {}, req);
    return sendSuccess(res, 'Supplier deleted successfully');
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return sendError(res, 'Failed to delete supplier', 500);
  }
};

module.exports = {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier
};
