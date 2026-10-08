/**
 * AquaNexus: Store & Inventory Manager Module Integration Test Suite
 *
 * Verifies End-to-End:
 * 1. Store Manager Authentication & RBAC restrictions
 * 2. Product Management (Real DB catalog, Create, Update, Safe Deactivate/Delete)
 * 3. Stock In (Atomic Inventory Increment, Negative/Zero Validation)
 * 4. Goods Received (Status Lifecycle: PENDING -> RECEIVED -> REJECTED, Idempotency & Duplicate Prevention)
 * 5. Returns (GOOD restocked, DAMAGED quarantined, no corruption)
 * 6. Damaged Goods (Write-off, Status Updates, Restoration on Rejection)
 * 7. Inventory Mathematical Consistency
 */

process.env.NODE_ENV = 'test';
require('dotenv').config({ path: '.env' });

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const bcrypt = require('bcryptjs');
const prisma = require('../src/config/db');
const app = require('../src/index');

let server;
let baseUrl;

const TEST_ORG_ID = 'd0000000-0000-4000-8000-000000000001';
let storeManagerToken;
let storeManagerUser;
let testProduct;
let testProductionBatch;
let testDistributor;

async function request(path, options = {}) {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // text only
  }
  return {
    status: res.status,
    headers: res.headers,
    body: json || text
  };
}

describe('Store & Inventory Manager Module - Complete End-to-End Suite', () => {

  before(async () => {
    // 1. Start ephemeral HTTP server
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // 2. Fetch or create STORE_MANAGER role and user
    let storeRole = await prisma.role.findFirst({ where: { name: 'STORE_MANAGER' } });
    if (!storeRole) {
      storeRole = await prisma.role.create({
        data: { name: 'STORE_MANAGER', description: 'Store and inventory management' }
      });
    }

    const passwordHash = await bcrypt.hash('StorePass@123', 10);

    storeManagerUser = await prisma.user.findFirst({
      where: { email: 'store.test@aquanexus.com' }
    });

    if (!storeManagerUser) {
      storeManagerUser = await prisma.user.create({
        data: {
          organizationId: TEST_ORG_ID,
          firstName: 'Store',
          lastName: 'Manager',
          username: 'store_test_user',
          email: 'store.test@aquanexus.com',
          passwordHash,
          status: 'ACTIVE',
          userRoles: {
            create: { roleId: storeRole.id }
          }
        }
      });
    }

    // 3. Authenticate Store Manager
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'store.test@aquanexus.com', password: 'StorePass@123' }
    });
    assert.equal(loginRes.status, 200, 'Store Manager login must succeed');
    storeManagerToken = loginRes.body.data.token;
    assert.ok(storeManagerToken, 'Token must be returned');

    // 4. Ensure a test distributor exists for return tests
    testDistributor = await prisma.distributor.findFirst({
      where: { organizationId: TEST_ORG_ID }
    });
    if (!testDistributor) {
      testDistributor = await prisma.distributor.create({
        data: {
          organizationId: TEST_ORG_ID,
          distributorCode: `DST-TEST-${Date.now().toString().slice(-4)}`,
          name: 'City Water Dist Inc',
          email: 'dist@citywater.test'
        }
      });
    }
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Disconnect prisma
    await prisma.$disconnect();
  });

  // ========================================================
  // 1. RBAC BOUNDARY TESTS
  // ========================================================
  test('1. RBAC: Store Manager can access store routes, blocked from accountant and admin system routes', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };

    // Allowed: Products, Inventory, Stock-Transactions
    const prodRes = await request('/api/products', { headers: authHeaders });
    assert.equal(prodRes.status, 200, 'Store Manager should access /api/products');

    const invRes = await request('/api/inventory', { headers: authHeaders });
    assert.equal(invRes.status, 200, 'Store Manager should access /api/inventory');

    const txRes = await request('/api/stock-transactions', { headers: authHeaders });
    assert.equal(txRes.status, 200, 'Store Manager should access /api/stock-transactions');

    // Blocked: Admin user management
    const usersRes = await request('/api/users', { headers: authHeaders });
    assert.equal(usersRes.status, 403, 'Store Manager must be denied from /api/users');

    // Blocked: Accountant Payroll
    const payrollRes = await request('/api/payroll', { headers: authHeaders });
    assert.equal(payrollRes.status, 403, 'Store Manager must be denied from /api/payroll');
  });

  // ========================================================
  // 2. PRODUCT MANAGEMENT & REAL CATALOG
  // ========================================================
  test('2. Product Management: Store Manager creates new product; initializes central inventory', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };
    const randomSku = `PRD-E2E-${Date.now().toString().slice(-5)}`;

    const createRes = await request('/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: {
        sku: randomSku,
        name: '20L Mineral Water Jar (E2E Test)',
        description: 'Multi-layer BPA-free bottle for store inventory verification',
        category: 'Finished Goods',
        unit: '20L Jar',
        costPrice: 25.50,
        sellingPrice: 80.00,
        minimumStock: 15,
        status: 'ACTIVE'
      }
    });

    assert.equal(createRes.status, 201, `Product creation should return 201: ${JSON.stringify(createRes.body)}`);
    testProduct = createRes.body.data;
    assert.ok(testProduct.id, 'Created product must have id');
    assert.equal(testProduct.sku, randomSku);

    // Verify Inventory record initialized with 0
    const inv = await prisma.inventory.findUnique({
      where: { productId: testProduct.id }
    });
    assert.ok(inv, 'Inventory record must be automatically created');
    assert.equal(inv.quantity, 0, 'Initial inventory quantity must be 0');
    assert.equal(inv.reorderLevel, 15, 'Reorder level must match minimumStock');
  });

  test('3. Product Management: Store Manager updates product details', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };

    const updateRes = await request(`/api/products/${testProduct.id}`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        name: '20L Premium Mineral Water Jar (Updated)',
        sellingPrice: 85.00,
        minimumStock: 20
      }
    });

    assert.equal(updateRes.status, 200, 'Product update should return 200');
    assert.equal(updateRes.body.data.name, '20L Premium Mineral Water Jar (Updated)');
    assert.equal(Number(updateRes.body.data.sellingPrice), 85.00);

    // Verify inventory reorder level updated
    const inv = await prisma.inventory.findUnique({ where: { productId: testProduct.id } });
    assert.equal(inv.reorderLevel, 20, 'Reorder level must be synchronized');
  });

  // ========================================================
  // 3. STOCK IN TRANSACTION & INVENTORY INTEGRATION
  // ========================================================
  test('4. Stock In: Store Manager inward entry updates inventory atomically', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };

    const stockInRes = await request('/api/stock-transactions', {
      method: 'POST',
      headers: authHeaders,
      body: {
        productId: testProduct.id,
        transactionType: 'STOCK_IN',
        quantity: 120,
        referenceType: 'supplier',
        referenceId: `PO-E2E-${Date.now().toString().slice(-4)}`,
        remarks: 'First batch supplier delivery'
      }
    });

    assert.equal(stockInRes.status, 201, 'Stock In must return 201');
    assert.equal(stockInRes.body.data.inventory.quantity, 120, 'Inventory quantity must increase to 120');

    // Verify directly in PostgreSQL via Prisma
    const inv = await prisma.inventory.findUnique({ where: { productId: testProduct.id } });
    assert.equal(inv.quantity, 120, 'Database inventory quantity must equal 120');

    // Verify StockTransaction record created
    const tx = await prisma.stockTransaction.findFirst({
      where: { productId: testProduct.id, transactionType: 'STOCK_IN' }
    });
    assert.ok(tx, 'Stock transaction audit log must exist');
    assert.equal(tx.quantity, 120);
  });

  test('5. Stock In: Rejects invalid or negative quantities', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };

    const negativeRes = await request('/api/stock-transactions', {
      method: 'POST',
      headers: authHeaders,
      body: {
        productId: testProduct.id,
        transactionType: 'STOCK_IN',
        quantity: -25
      }
    });
    assert.equal(negativeRes.status, 400, 'Negative quantity must return 400');

    const zeroRes = await request('/api/stock-transactions', {
      method: 'POST',
      headers: authHeaders,
      body: {
        productId: testProduct.id,
        transactionType: 'STOCK_IN',
        quantity: 0
      }
    });
    assert.equal(zeroRes.status, 400, 'Zero quantity must return 400');
  });

  // ========================================================
  // 4. GOODS RECEIVED (GRN) LIFECYCLE & DUPLICATE PREVENTION
  // ========================================================
  test('6. Goods Received: PENDING status does NOT increment stock; RECEIVED status increments stock once (No Duplicates)', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };

    // 1. Create a production batch
    const randomBatch = `BATCH-E2E-${Date.now().toString().slice(-5)}`;
    testProductionBatch = await prisma.production.create({
      data: {
        organizationId: TEST_ORG_ID,
        productionNumber: `PRD-NUM-${Date.now().toString().slice(-4)}`,
        batchNumber: randomBatch,
        productId: testProduct.id,
        quantity: 100,
        productionDate: new Date(),
        status: 'COMPLETED',
        createdBy: storeManagerUser.id
      }
    });

    const stockBeforeGRN = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;

    // 2. Create Goods Received in PENDING status
    const grnRes = await request('/api/goods-received', {
      method: 'POST',
      headers: authHeaders,
      body: {
        productionId: testProductionBatch.id,
        productId: testProduct.id,
        quantity: 50,
        status: 'PENDING',
        grnNumber: `GRN-E2E-${Date.now().toString().slice(-4)}`,
        remarks: 'Batch under QA quarantine testing'
      }
    });

    assert.equal(grnRes.status, 201, 'GRN creation must succeed');
    const grnId = grnRes.body.data.id || grnRes.body.data.goodsReceived.id;
    assert.equal(grnRes.body.data.goodsReceived.status, 'PENDING');

    // Verify stock did NOT increment while PENDING
    const stockAfterPending = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;
    assert.equal(stockAfterPending, stockBeforeGRN, 'Inventory must NOT increment while GRN is in PENDING status');

    // 3. Update GRN status to RECEIVED
    const receiveUpdateRes = await request(`/api/goods-received/${grnId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        status: 'RECEIVED',
        receivedQuantity: 50,
        remarks: 'Microbiology tests cleared, shelf approved'
      }
    });

    assert.equal(receiveUpdateRes.status, 200, 'GRN status update must return 200');
    assert.equal(receiveUpdateRes.body.data.goodsReceived.status, 'RECEIVED');

    // Verify stock incremented by 50
    const stockAfterReceived = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;
    assert.equal(stockAfterReceived, stockBeforeGRN + 50, 'Inventory must increment by 50 when received');

    // 4. DUPLICATE PREVENTION: Update status again to RECEIVED
    const duplicateRes = await request(`/api/goods-received/${grnId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        status: 'RECEIVED',
        receivedQuantity: 50,
        remarks: 'Re-saving remarks without changing quantity'
      }
    });

    assert.equal(duplicateRes.status, 200);
    const stockAfterDuplicateSave = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;
    assert.equal(
      stockAfterDuplicateSave,
      stockAfterReceived,
      'Duplicate status save must NOT increment inventory again (Idempotency check)'
    );
  });

  // ========================================================
  // 5. RETURNS WORKFLOW & INVENTORY PRESERVATION
  // ========================================================
  test('7. Returns: Store Manager manages return status; GOOD condition restocked, DAMAGED quarantined', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };

    const initialStock = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;

    // Create a secondary product for damaged items (ReturnItem enforces @@unique([returnId, productId]))
    const damagedSku = `PRD-DMG-${Date.now().toString().slice(-5)}`;
    const createDmgProd = await request('/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: {
        sku: damagedSku,
        name: '20L Jar Empty Scrap (E2E Test)',
        category: 'Packaging',
        unit: 'Jar',
        costPrice: 20,
        sellingPrice: 40,
        minimumStock: 10,
        status: 'ACTIVE'
      }
    });
    assert.equal(createDmgProd.status, 201, 'Damaged product creation must succeed');
    const damagedProductId = createDmgProd.body.data.id;

    // 1. Create a return with 10 GOOD and 5 DAMAGED items
    const returnNumber = `RET-E2E-${Date.now().toString().slice(-4)}`;
    const createRetRes = await request('/api/returns', {
      method: 'POST',
      headers: authHeaders,
      body: {
        returnNumber,
        distributorId: testDistributor.id,
        returnDate: new Date().toISOString().slice(0, 10),
        reason: 'Customer returned 10 reusable empties, 5 cracked in transit',
        items: [
          { productId: testProduct.id, quantity: 10, condition: 'GOOD', remarks: 'Clean empty bottles' },
          { productId: damagedProductId, quantity: 5, condition: 'DAMAGED', remarks: 'Cracked neck' }
        ]
      }
    });

    assert.equal(createRetRes.status, 201, `Return creation must succeed: ${JSON.stringify(createRetRes.body)}`);
    const returnId = createRetRes.body.data.return.id;

    // 2. Store Manager updates Return status to RECEIVED
    const updateRetRes = await request(`/api/returns/${returnId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: {
        status: 'RECEIVED',
        remarks: 'Physical inspection completed at central warehouse'
      }
    });

    assert.equal(updateRetRes.status, 200, 'Return status update must return 200');
    assert.equal(updateRetRes.body.data.return.status, 'RECEIVED');

    // 3. Verify Store Inventory:
    // Only the 10 GOOD bottles must be restocked into central inventory (+10).
    // The 5 DAMAGED bottles must NOT be added to saleable inventory!
    const stockAfterReturn = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;
    assert.equal(stockAfterReturn, initialStock + 10, 'Only GOOD returned items must increment inventory');

    const damagedProductStock = (await prisma.inventory.findUnique({ where: { productId: damagedProductId } })).quantity;
    assert.equal(damagedProductStock, 0, 'Damaged return items must NOT be added to saleable inventory');

    // 4. Verify Damaged transaction logged for quarantine
    const damagedTx = await prisma.stockTransaction.findFirst({
      where: { referenceId: returnId, transactionType: 'DAMAGED' }
    });
    assert.ok(damagedTx, 'DAMAGED return items must be logged in stock transactions for quarantine');
    assert.equal(damagedTx.quantity, 5);
    assert.equal(damagedTx.productId, damagedProductId);
  });

  // ========================================================
  // 6. DAMAGED GOODS WORKFLOW & STOCK CONSISTENCY
  // ========================================================
  test('8. Damaged Goods: Report writes off stock; Rejecting claim restores inventory', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };

    const stockBeforeDmg = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;

    // 1. Store Manager reports 12 damaged items
    const dmgRes = await request('/api/stock-transactions', {
      method: 'POST',
      headers: authHeaders,
      body: {
        productId: testProduct.id,
        transactionType: 'DAMAGED',
        quantity: 12,
        referenceType: 'cracked_jar',
        referenceId: `DMG-E2E-${Date.now().toString().slice(-4)}`,
        status: 'REPORTED',
        remarks: 'Transit impact damage on pallet'
      }
    });

    assert.equal(dmgRes.status, 201, 'Damaged report must return 201');
    const dmgTxId = dmgRes.body.data.transaction.id;

    // Stock should be decremented by 12
    const stockAfterDmg = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;
    assert.equal(stockAfterDmg, stockBeforeDmg - 12, 'Inventory must be reduced by damaged quantity');

    // 2. Move to UNDER_REVIEW
    const reviewRes = await request(`/api/stock-transactions/${dmgTxId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { status: 'UNDER_REVIEW', remarks: 'Quality supervisor reviewing claim' }
    });
    assert.equal(reviewRes.status, 200);
    assert.equal(reviewRes.body.data.transaction.status, 'UNDER_REVIEW');

    // 3. Reject claim (False alarm, bottles intact) -> Stock must be RESTORED!
    const rejectRes = await request(`/api/stock-transactions/${dmgTxId}/status`, {
      method: 'PATCH',
      headers: authHeaders,
      body: { status: 'REJECTED', remarks: 'Bottles re-tested; micro-inspection passed, claim rejected' }
    });
    assert.equal(rejectRes.status, 200);
    assert.equal(rejectRes.body.data.transaction.status, 'REJECTED');

    // Verify stock restored
    const stockAfterReject = (await prisma.inventory.findUnique({ where: { productId: testProduct.id } })).quantity;
    assert.equal(stockAfterReject, stockBeforeDmg, 'Rejected damage claim must restore stock to original level');
  });

  // ========================================================
  // 7. SAFE PRODUCT DEACTIVATION VS UNREFERENCED DELETE
  // ========================================================
  test('9. Safe Delete / Deactivation: Referenced product is soft-deactivated (INACTIVE); unreferenced product is deleted', async () => {
    const authHeaders = { Authorization: `Bearer ${storeManagerToken}` };

    // 1. Try to delete testProduct (which now has transactions, inventory, GRN, returns)
    const deleteReferencedRes = await request(`/api/products/${testProduct.id}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    assert.equal(deleteReferencedRes.status, 200, 'Delete referenced product should return 200');
    assert.equal(
      deleteReferencedRes.body.data.action,
      'DEACTIVATED',
      'Referenced product must be DEACTIVATED instead of hard deleted'
    );
    assert.equal(deleteReferencedRes.body.data.product.status, 'INACTIVE');

    // Verify still in database but with INACTIVE status
    const dbProduct = await prisma.product.findUnique({ where: { id: testProduct.id } });
    assert.ok(dbProduct, 'Product record must not be deleted from DB');
    assert.equal(dbProduct.status, 'INACTIVE', 'Status must be INACTIVE');

    // 2. Create an unreferenced product and delete it permanently
    const unrefSku = `UNREF-${Date.now().toString().slice(-4)}`;
    const unrefCreate = await request('/api/products', {
      method: 'POST',
      headers: authHeaders,
      body: {
        sku: unrefSku,
        name: 'Temporary Unused Product',
        category: 'Packaging',
        unit: 'Piece',
        costPrice: 1.0,
        sellingPrice: 2.0,
        minimumStock: 0,
        status: 'ACTIVE'
      }
    });
    const unrefId = unrefCreate.body.data.id;

    // Delete unreferenced product
    const deleteUnrefRes = await request(`/api/products/${unrefId}`, {
      method: 'DELETE',
      headers: authHeaders
    });

    assert.equal(deleteUnrefRes.status, 200);
    assert.equal(deleteUnrefRes.body.data.action, 'DELETED', 'Unreferenced product must be permanently DELETED');

    const deletedInDb = await prisma.product.findUnique({ where: { id: unrefId } });
    assert.equal(deletedInDb, null, 'Unreferenced product must be completely removed from DB');
  });

});
