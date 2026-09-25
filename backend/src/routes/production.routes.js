const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const {
  getProductions,
  getProductionById,
  createProduction,
  updateProductionStatus
} = require('../controllers/production.controller');

router.use(requireAuth);
router.use(requireRole(["ADMIN", "MANAGER", "STORE_MANAGER", "OPERATOR"]));

router.get('/', getProductions);
router.get('/:id', getProductionById);
router.post('/', createProduction);
router.patch('/:id', updateProductionStatus);

module.exports = router;

