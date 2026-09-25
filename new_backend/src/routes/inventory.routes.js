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
  createStockTransaction
} = require('../controllers/inventory.controller');

router.use(requireAuth);
router.use(requireManagerArea('STORE'));

// Inventory balances & stock status
router.get('/inventory', requirePermission('inventory.view'), getInventory);
router.get('/inventory/low-stock', requirePermission('inventory.view'), getLowStockAlerts);

// Stock audit transactions
router.get('/stock-transactions', requirePermission('inventory.view'), getStockTransactions);
router.post('/stock-transactions', requirePermission('inventory.manage'), createStockTransaction);

// Goods Received from Production
router.post('/goods-received', requirePermission('inventory.manage'), receiveGoods);

module.exports = router;
