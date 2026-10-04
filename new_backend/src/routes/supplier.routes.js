const express = require('express');
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplier.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireTenantContext } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requireRole(['ADMIN', 'ACCOUNTANT', 'MANAGER', 'STORE_MANAGER', 'SUPPLIER']), getSuppliers);
router.post('/', requireRole(['ADMIN', 'ACCOUNTANT']), createSupplier);
router.put('/:id', requireRole(['ADMIN', 'ACCOUNTANT']), updateSupplier);
router.delete('/:id', requireRole(['ADMIN', 'ACCOUNTANT']), deleteSupplier);

module.exports = router;
