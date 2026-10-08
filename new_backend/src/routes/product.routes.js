const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireTenantContext } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');

router.use(requireAuth, requireTenantContext);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', requireRole(['ADMIN', 'MANAGER', 'STORE_MANAGER']), createProduct);
router.patch('/:id', requireRole(['ADMIN', 'MANAGER', 'STORE_MANAGER']), updateProduct);
router.delete('/:id', requireRole(['ADMIN', 'MANAGER', 'STORE_MANAGER']), deleteProduct);

module.exports = router;

