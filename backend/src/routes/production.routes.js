const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getProductions,
  getProductionById,
  createProduction,
  updateProductionStatus
} = require('../controllers/production.controller');

router.get('/', requireAuth, requirePermission('production.view'), getProductions);
router.get('/:id', requireAuth, requirePermission('production.view'), getProductionById);
router.post('/', requireAuth, requirePermission('production.create'), createProduction);
router.patch('/:id', requireAuth, requirePermission('production.update'), updateProductionStatus);

module.exports = router;
