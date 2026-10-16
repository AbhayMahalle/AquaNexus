const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const auditService = require('../services/audit.service');
const { isValidPhone, isValidEmail, extractPhoneDigits } = require('../utils/validation');

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: req.organizationId },
      orderBy: { createdAt: 'desc' }
    });
    return sendSuccess(res, { suppliers, data: suppliers }, 'Suppliers fetched successfully');
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return sendError(res, 'Failed to fetch suppliers', 500);
  }
};

const createSupplier = async (req, res) => {
  try {
    const { supplierCode, name, email, phone, address, status } = req.body;

    if (email && !isValidEmail(email)) {
      return sendError(res, 'Please provide a valid email address', 400);
    }

    if (phone && !isValidPhone(phone)) {
      return sendError(res, 'Phone number must be exactly 10 digits', 400);
    }

    const cleanPhone = phone ? extractPhoneDigits(phone) : null;

    const newSupplier = await prisma.supplier.create({
      data: {
        supplierCode,
        name,
        email: email ? email.trim() : null,
        phone: cleanPhone,
        address,
        status: status || 'ACTIVE',
        organizationId: req.organizationId,
      }
    });

    await auditService.logAction(req.user.id, 'CREATE', 'SUPPLIER', newSupplier.id, {}, newSupplier, req);

    return sendSuccess(res, { supplier: newSupplier, data: newSupplier }, 'Supplier created successfully', 201);
  } catch (error) {
    if (error.code === 'P2002') {
      return sendError(res, 'A supplier with this code already exists in your organization', 409);
    }
    console.error('Error creating supplier:', error);
    return sendError(res, 'Failed to create supplier', 500);
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };
    
    if (updates.email && !isValidEmail(updates.email)) {
      return sendError(res, 'Please provide a valid email address', 400);
    }

    if (updates.phone && !isValidPhone(updates.phone)) {
      return sendError(res, 'Phone number must be exactly 10 digits', 400);
    }

    if (updates.phone) {
      updates.phone = extractPhoneDigits(updates.phone);
    }

    const oldSupplier = await prisma.supplier.findFirst({
      where: { id, organizationId: req.organizationId },
    });
    if (!oldSupplier) return sendError(res, 'Supplier not found in your organization', 404);

    const updatedSupplier = await prisma.supplier.update({
      where: { id },
      data: updates
    });

    await auditService.logAction(req.user.id, 'UPDATE', 'SUPPLIER', updatedSupplier.id, oldSupplier, updatedSupplier, req);

    return sendSuccess(res, { supplier: updatedSupplier, data: updatedSupplier }, 'Supplier updated successfully');
  } catch (error) {
    console.error('Error updating supplier:', error);
    return sendError(res, 'Failed to update supplier', 500);
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const oldSupplier = await prisma.supplier.findFirst({
      where: { id, organizationId: req.organizationId },
    });
    if (!oldSupplier) return sendError(res, 'Supplier not found in your organization', 404);
    
    await prisma.supplier.delete({ where: { id } });
    
    await auditService.logAction(req.user.id, 'DELETE', 'SUPPLIER', id, oldSupplier, {}, req);
    return sendSuccess(res, { success: true }, 'Supplier deleted successfully');
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
