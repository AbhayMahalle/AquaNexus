const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct
} = require('../controllers/product.controller');

router.get('/', requireAuth, requirePermission('production.view'), getProducts);
router.get('/:id', requireAuth, requirePermission('production.view'), getProductById);
router.post('/', requireAuth, requirePermission('inventory.manage'), createProduct);
router.patch('/:id', requireAuth, requirePermission('inventory.manage'), updateProduct);

module.exports = router;
