const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { requireManagerArea } = require('../middleware/managerAccess.middleware');
const {
  getInventory,
  getLowStockAlerts,
  getStockTransactions,
  receiveGoods,
  getGoodsReceived,
  createStockTransaction
} = require('../controllers/inventory.controller');

// Inventory balances & stock status
router.get('/inventory', requireAuth, requireManagerArea('STORE'), requirePermission('inventory.view'), getInventory);
router.get('/inventory/low-stock', requireAuth, requireManagerArea('STORE'), requirePermission('inventory.view'), getLowStockAlerts);

// Stock audit transactions
router.get('/stock-transactions', requireAuth, requireManagerArea('STORE'), requirePermission('inventory.view'), getStockTransactions);
router.post('/stock-transactions', requireAuth, requireManagerArea('STORE'), requirePermission('inventory.manage'), createStockTransaction);

// Goods Received from Production
router.get('/goods-received', requireAuth, requireManagerArea('STORE'), requirePermission('inventory.view'), getGoodsReceived);
router.post('/goods-received', requireAuth, requireManagerArea('STORE'), requirePermission('inventory.manage'), receiveGoods);

module.exports = router;
