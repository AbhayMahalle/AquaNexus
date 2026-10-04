const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireTenantContext } = require('../middleware/tenant.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct
} = require('../controllers/product.controller');

router.use(requireAuth, requireTenantContext);

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', requirePermission('inventory.manage'), createProduct);
router.patch('/:id', requirePermission('inventory.manage'), updateProduct);

module.exports = router;
