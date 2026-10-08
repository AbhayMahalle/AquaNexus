const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireTenantContext } = require('../middleware/tenant.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const { requireManagerArea } = require('../middleware/managerAccess.middleware');
const {
  getInventory,
  getLowStockAlerts,
  getStockTransactions,
  receiveGoods,
  getGoodsReceived,
  createStockTransaction,
  updateGoodsReceivedStatus,
  updateStockTransactionStatus
} = require('../controllers/inventory.controller');

const inventoryGuards = [requireAuth, requireTenantContext, requireManagerArea('STORE')];

// Inventory balances & stock status
router.get('/inventory', inventoryGuards, requirePermission('inventory.view'), getInventory);
router.get('/inventory/low-stock', inventoryGuards, requirePermission('inventory.view'), getLowStockAlerts);

// Stock audit transactions
router.get('/stock-transactions', inventoryGuards, requirePermission('inventory.view'), getStockTransactions);
router.post('/stock-transactions', inventoryGuards, requirePermission('inventory.manage'), createStockTransaction);
router.patch('/stock-transactions/:id/status', inventoryGuards, requirePermission('inventory.manage'), updateStockTransactionStatus);

// Goods Received from Production
router.get('/goods-received', inventoryGuards, requirePermission('inventory.view'), getGoodsReceived);
router.post('/goods-received', inventoryGuards, requirePermission('inventory.manage'), receiveGoods);
router.patch('/goods-received/:id/status', inventoryGuards, requirePermission('inventory.manage'), updateGoodsReceivedStatus);

module.exports = router;
