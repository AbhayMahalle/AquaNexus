const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { requireManagerArea } = require('../middleware/managerAccess.middleware');
const {
  getProductions,
  getProductionById,
  createProduction,
  updateProductionStatus
} = require('../controllers/production.controller');

router.use(requireAuth);
router.use(requireManagerArea('PRODUCTION'));

router.get('/', requirePermission('production.view'), getProductions);
router.get('/:id', requirePermission('production.view'), getProductionById);
router.post('/', requirePermission('production.create'), createProduction);
router.patch('/:id', requirePermission('production.update'), updateProductionStatus);

module.exports = router;
