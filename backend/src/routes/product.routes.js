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

const canViewProducts = (req, res, next) => {
  const roleName = req.user?.role?.name;
  if (roleName === 'DISTRIBUTOR') return next();
  return requirePermission('production.view')(req, res, next);
};

router.get('/', requireAuth, canViewProducts, getProducts);
router.get('/:id', requireAuth, canViewProducts, getProductById);
router.post('/', requireAuth, requirePermission('inventory.manage'), createProduct);
router.patch('/:id', requireAuth, requirePermission('inventory.manage'), updateProduct);

module.exports = router;
