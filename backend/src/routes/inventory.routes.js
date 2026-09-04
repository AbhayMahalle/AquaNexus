const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getInventory,
  getLowStockAlerts,
  getStockTransactions,
  receiveGoods,
  createStockTransaction
} = require('../controllers/inventory.controller');

// Inventory balances & stock status
router.get('/inventory', requireAuth, requirePermission('inventory.view'), getInventory);
router.get('/inventory/low-stock', requireAuth, requirePermission('inventory.view'), getLowStockAlerts);

// Stock audit transactions
router.get('/stock-transactions', requireAuth, requirePermission('inventory.view'), getStockTransactions);
router.post('/stock-transactions', requireAuth, requirePermission('inventory.manage'), createStockTransaction);

// Goods Received from Production
router.post('/goods-received', requireAuth, requirePermission('inventory.manage'), receiveGoods);

module.exports = router;
