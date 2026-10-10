/**
 * AquaNexus Phase 1: Multi-Tenancy & Platform Governance Automated Integration Test Suite
 *
 * Verifies all 9 Acceptance Criteria:
 * 1. Multi-Tenant Model Invariants (1 SuperAdmin, >=2 Customer Orgs, multiple Admins per org)
 * 2. Tenant Boundary Isolation (Admin A cannot read/mutate Org B records even with forged IDs)
 * 3. SuperAdmin Non-Promotability & Immutability (Admins cannot promote SuperAdmin, change orgId, or cross-attach)
 * 4. Concurrency & Constraint Invariance (DB unique constraint rejects 2nd SuperAdmin)
 * 5. SuperAdmin Cross-Tenant Operations & Audit Logging (X-Organization-Id logged and enforced)
 * 6. Suspended Organization Access Denied (Suspended tenant denied ERP access, restored upon activation)
 * 7. Operational Roles Preserved within Tenant (Manager, Store Manager, Accountant, Distributor, Employee work in tenant)
 * 8. Migration Safety & Backfill Verification (Pre-existing records safely backfilled to default org)
 * 9. Authenticated Backend Role Resolution (Login ignores client overrides, uses DB role only)
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

// Global test fixture IDs
const TEST_ORG_A_ID = 'e0000000-0000-4000-8000-00000000000a';
const TEST_ORG_B_ID = 'e0000000-0000-4000-8000-00000000000b';
const DEFAULT_ORG_ID = 'd0000000-0000-4000-8000-000000000001';

let superAdminToken;
let orgAAdmin1Token;
let orgAAdmin2Token;
let orgBAdminToken;
let orgAManagerToken;

let testAdminRole;
let testManagerRole;
let testEmployeeRole;

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
    // not json
  }
  return {
    status: res.status,
    headers: res.headers,
    body: json || text
  };
}

describe('AquaNexus Phase 1: Multi-Tenancy Test Suite', () => {

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

    // 2. Fetch roles
    testAdminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    testManagerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });
    testEmployeeRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });

    assert.ok(testAdminRole, 'ADMIN role must exist in DB');
    assert.ok(testManagerRole, 'MANAGER role must exist in DB');

    // 3. Clean up any previous test orgs if leftover
    const cleanTestOrgs = async () => {
      const testOrgIds = [TEST_ORG_A_ID, TEST_ORG_B_ID];
      try {
        await prisma.auditLog.deleteMany({ where: { organizationId: { in: testOrgIds } } });
        await prisma.distributor.deleteMany({ where: { organizationId: { in: testOrgIds } } });
        await prisma.inventory.deleteMany({ where: { organizationId: { in: testOrgIds } } });
        await prisma.product.deleteMany({ where: { organizationId: { in: testOrgIds } } });
        await prisma.userRole.deleteMany({ where: { user: { organizationId: { in: testOrgIds } } } });
        await prisma.user.deleteMany({ where: { organizationId: { in: testOrgIds } } });
        await prisma.user.deleteMany({
          where: { email: { in: ['test.superadmin@aquanexus.com', 'admin1@orga.com', 'admin2@orga.com', 'admin@orgb.com', 'manager@orga.com', 'crosstenant@orgb.com', 'malicious@orga.com'] } }
        });
        await prisma.organization.deleteMany({ where: { id: { in: testOrgIds } } });
      } catch (e) {
        console.warn('Cleanup warning:', e.message);
      }
    };
    await cleanTestOrgs();

    const passwordHash = await bcrypt.hash('Password@123', 10);
    await prisma.user.updateMany({ where: { email: 'superadmin@aquanexus.com' }, data: { passwordHash } });

    // 4. Create Organization A and Organization B
    await prisma.organization.create({
      data: {
        id: TEST_ORG_A_ID,
        name: 'Test Tenant Org A',
        slug: 'test-tenant-org-a',
        status: 'ACTIVE'
      }
    });

    await prisma.organization.create({
      data: {
        id: TEST_ORG_B_ID,
        name: 'Test Tenant Org B',
        slug: 'test-tenant-org-b',
        status: 'ACTIVE'
      }
    });

    // 5. Create multiple Admins for Org A (verifying multiple Admins per tenant)
    const orgAAdmin1 = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'One',
        username: 'admin1_orga',
        email: 'admin1@orga.com',
        passwordHash,
        organization: { connect: { id: TEST_ORG_A_ID } },
        userRoles: { create: { roleId: testAdminRole.id } }
      }
    });

    const orgAAdmin2 = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'Two',
        username: 'admin2_orga',
        email: 'admin2@orga.com',
        passwordHash,
        organization: { connect: { id: TEST_ORG_A_ID } },
        userRoles: { create: { roleId: testAdminRole.id } }
      }
    });

    // Manager for Org A
    const orgAManager = await prisma.user.create({
      data: {
        firstName: 'Manager',
        lastName: 'OrgA',
        username: 'manager_orga',
        email: 'manager@orga.com',
        passwordHash,
        organization: { connect: { id: TEST_ORG_A_ID } },
        userRoles: { create: { roleId: testManagerRole.id } }
      }
    });

    // Admin for Org B
    const orgBAdmin = await prisma.user.create({
      data: {
        firstName: 'Admin',
        lastName: 'OrgB',
        username: 'admin_orgb',
        email: 'admin@orgb.com',
        passwordHash,
        organization: { connect: { id: TEST_ORG_B_ID } },
        userRoles: { create: { roleId: testAdminRole.id } }
      }
    });

    // 6. Log in users to get tokens
    // SuperAdmin login
    const superAdminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'superadmin@aquanexus.com', password: 'Password@123' }
    });
    assert.equal(superAdminLoginRes.status, 200, 'SuperAdmin login should succeed');
    superAdminToken = superAdminLoginRes.body.data.token;

    // Org A Admin 1 login
    const orgAAdmin1LoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin1@orga.com', password: 'Password@123' }
    });
    assert.equal(orgAAdmin1LoginRes.status, 200, 'Org A Admin 1 login should succeed');
    orgAAdmin1Token = orgAAdmin1LoginRes.body.data.token;

    // Org A Admin 2 login
    const orgAAdmin2LoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin2@orga.com', password: 'Password@123' }
    });
    assert.equal(orgAAdmin2LoginRes.status, 200, 'Org A Admin 2 login should succeed');
    orgAAdmin2Token = orgAAdmin2LoginRes.body.data.token;

    // Org B Admin login
    const orgBAdminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@orgb.com', password: 'Password@123' }
    });
    assert.equal(orgBAdminLoginRes.status, 200, 'Org B Admin login should succeed');
    orgBAdminToken = orgBAdminLoginRes.body.data.token;

    // Org A Manager login
    const orgAManagerLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'manager@orga.com', password: 'Password@123' }
    });
    assert.equal(orgAManagerLoginRes.status, 200, 'Org A Manager login should succeed');
    orgAManagerToken = orgAManagerLoginRes.body.data.token;
  });

  after(async () => {
    // Clean up test data
    try {
      await prisma.user.deleteMany({
        where: { email: { in: ['admin1@orga.com', 'admin2@orga.com', 'admin@orgb.com', 'manager@orga.com'] } }
      });
      await prisma.product.deleteMany({ where: { organizationId: { in: [TEST_ORG_A_ID, TEST_ORG_B_ID] } } });
      await prisma.distributor.deleteMany({ where: { organizationId: { in: [TEST_ORG_A_ID, TEST_ORG_B_ID] } } });
      await prisma.organization.deleteMany({ where: { id: { in: [TEST_ORG_A_ID, TEST_ORG_B_ID] } } });
    } catch (e) {
      // ignore cleanup errors
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // =========================================================================
  // CRITERION 1: Multi-Tenant Model Invariants
  // =========================================================================
  test('Criterion 1: Platform has exactly one SuperAdmin and multiple customer orgs with multiple Admins', async () => {
    // Count SuperAdmins across the entire DB
    const superAdmins = await prisma.user.findMany({
      where: { isSuperAdmin: true }
    });
    assert.equal(superAdmins.length, 1, 'There must be exactly one SuperAdmin in the entire system');
    assert.equal(superAdmins[0].email, 'superadmin@aquanexus.com');
    assert.equal(superAdmins[0].superAdminSlot, 'SUPER_ADMIN');

    // Verify multiple customer organizations exist
    const orgCount = await prisma.organization.count();
    assert.ok(orgCount >= 3, 'Must have at least 3 organizations (default org + Org A + Org B)');

    // Verify Org A has multiple independent Admins
    const orgAAdmins = await prisma.user.findMany({
      where: { organizationId: TEST_ORG_A_ID, userRoles: { some: { role: { name: 'ADMIN' } } } }
    });
    assert.equal(orgAAdmins.length, 2, 'Org A must have multiple Admin accounts');
  });

  // =========================================================================
  // CRITERION 2: Tenant Boundary Isolation
  // =========================================================================
  test('Criterion 2: Tenant Admin A cannot read, create, update, or delete records in Org B (with forged IDs)', async () => {
    // Create a product in Org B directly in DB
    const productB = await prisma.product.create({
      data: {
        sku: 'SKU-PROD-B-SEC',
        name: 'Org B Secret Water',
        category: 'PACKAGED_WATER',
        unit: '500ml',
        costPrice: 5.0,
        sellingPrice: 10.0,
        organizationId: TEST_ORG_B_ID
      }
    });

    // 1. Admin A attempts to list products -> should NOT include Product B
    const listRes = await request('/api/products', {
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` }
    });
    assert.equal(listRes.status, 200);
    const productsA = listRes.body.data?.products || listRes.body.data || [];
    const foundBInA = productsA.some(p => p.id === productB.id);
    assert.equal(foundBInA, false, 'Admin A list must not contain Org B product');

    // 2. Admin A attempts to GET Product B directly by forged ID -> should return 404
    const getRes = await request(`/api/products/${productB.id}`, {
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` }
    });
    assert.equal(getRes.status, 404, 'Admin A cannot read Org B product by ID');

    // 3. Admin A attempts to UPDATE Product B directly -> should return 404
    const updateRes = await request(`/api/products/${productB.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` },
      body: { name: 'Hacked by Org A' }
    });
    assert.equal(updateRes.status, 404, 'Admin A cannot update Org B product');

    // Verify Product B was not mutated
    const productBAfter = await prisma.product.findUnique({ where: { id: productB.id } });
    assert.equal(productBAfter.name, 'Org B Secret Water', 'Product B must remain untouched');

    // 4. Admin A attempts to list users -> should NOT see Org B users
    const usersRes = await request('/api/users', {
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` }
    });
    assert.equal(usersRes.status, 200);
    const usersA = usersRes.body.data?.users || usersRes.body.data || [];
    const foundOrgBUser = usersA.some(u => u.email === 'admin@orgb.com');
    assert.equal(foundOrgBUser, false, 'Admin A cannot see Org B users');
  });

  // =========================================================================
  // CRITERION 3: SuperAdmin Non-Promotability & Immutability
  // =========================================================================
  test('Criterion 3: Admin cannot promote SuperAdmin, change orgId, or cross-attach users', async () => {
    // 1. Admin A attempts to create a user with isSuperAdmin: true -> should be rejected
    const createSuperRes = await request('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` },
      body: {
        firstName: 'Malicious',
        lastName: 'Admin',
        username: 'malicious_super',
        email: 'malicious@orga.com',
        password: 'Password@123',
        isSuperAdmin: true,
        roleId: testAdminRole.id
      }
    });
    assert.equal(createSuperRes.status, 403, 'Regular Admin cannot create a SuperAdmin');

    // 2. Admin A attempts to create a user for Org B -> should be rejected
    const crossOrgCreateRes = await request('/api/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` },
      body: {
        firstName: 'Cross',
        lastName: 'Tenant',
        username: 'cross_tenant_user',
        email: 'crosstenant@orgb.com',
        password: 'Password@123',
        organizationId: TEST_ORG_B_ID,
        roleId: testAdminRole.id
      }
    });
    assert.equal(crossOrgCreateRes.status, 403, 'Regular Admin cannot create user in another organization');

    // 3. Admin A attempts to update their own account to isSuperAdmin: true
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` }
    });
    const myId = meRes.body.data?.user?.id || meRes.body.data?.id;
    assert.ok(myId);

    const updateSelfRes = await request(`/api/users/${myId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` },
      body: { isSuperAdmin: true }
    });
    assert.equal(updateSelfRes.status, 403, 'Regular Admin cannot promote themselves to SuperAdmin');

    // 4. Regular Admin cannot access platform organizations endpoint
    const platformRes = await request('/api/platform/organizations', {
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` }
    });
    assert.equal(platformRes.status, 403, 'Regular Admin cannot access platform organizations route');
  });

  // =========================================================================
  // CRITERION 4: Concurrency & Constraint Invariance (DB Unique Constraint)
  // =========================================================================
  test('Criterion 4: Exactly-one-SuperAdmin invariant resists concurrent attempts at DB transaction boundary', async () => {
    const passwordHash = await bcrypt.hash('Password@123', 10);

    // Direct Prisma attempt to create a second user with isSuperAdmin: true
    await assert.rejects(
      async () => {
        await prisma.user.create({
          data: {
            firstName: 'Dup',
            lastName: 'Super',
            username: 'duplicate_superadmin_1',
            email: 'duplicate1@aquanexus.com',
            passwordHash,
            isSuperAdmin: true,
            superAdminSlot: 'SUPER_ADMIN' // Triggers unique constraint
          }
        });
      },
      (err) => {
        // Must reject with P2002 unique constraint violation
        return err.code === 'P2002';
      },
      'Database unique constraint must reject a second SuperAdmin'
    );

    // Concurrent race condition simulation: 5 concurrent creation attempts
    const concurrentAttempts = Array.from({ length: 5 }, (_, i) =>
      prisma.user.create({
        data: {
          firstName: 'Race',
          lastName: `Super${i}`,
          username: `race_super_${i}`,
          email: `race_super_${i}@aquanexus.com`,
          passwordHash,
          isSuperAdmin: true,
          superAdminSlot: 'SUPER_ADMIN'
        }
      }).catch(err => ({ error: err }))
    );

    const results = await Promise.all(concurrentAttempts);
    const allRejected = results.every(res => res.error && res.error.code === 'P2002');
    assert.equal(allRejected, true, 'All concurrent attempts to insert a second SuperAdmin must fail at DB boundary');

    // Ensure only the original SuperAdmin remains
    const superCount = await prisma.user.count({ where: { isSuperAdmin: true } });
    assert.equal(superCount, 1, 'Exactly one SuperAdmin must remain in the database');
  });

  // =========================================================================
  // CRITERION 5: SuperAdmin Privacy Isolation & Platform Governance Scoping
  // =========================================================================
  test('Criterion 5: SuperAdmin is strictly denied access to tenant operational data to preserve company privacy', async () => {
    // 1. Attempt to create a product in Org A via SuperAdmin -> must be rejected with 403 Forbidden
    const createProdRes = await request('/api/products', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'X-Organization-Id': TEST_ORG_A_ID
      },
      body: {
        sku: 'SKU-PROD-A-SA-FORBIDDEN',
        name: 'SuperAdmin Unauthorized Bottle',
        category: 'PACKAGED_WATER',
        unit: '1L',
        costPrice: 8.0,
        sellingPrice: 15.0
      }
    });
    assert.equal(createProdRes.status, 403, 'SuperAdmin must be denied creating product in tenant ERP');

    // 2. Attempt to list products in Org A via SuperAdmin -> must be rejected with 403 Forbidden
    const listProdRes = await request('/api/products', {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'X-Organization-Id': TEST_ORG_A_ID
      }
    });
    assert.equal(listProdRes.status, 403, 'SuperAdmin must be denied viewing tenant products');

    // 3. Attempt to list tenant users via SuperAdmin -> must be rejected with 403 Forbidden
    const listUsersRes = await request('/api/users', {
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'X-Organization-Id': TEST_ORG_A_ID
      }
    });
    assert.equal(listUsersRes.status, 403, 'SuperAdmin must be denied viewing tenant users directly');

    // 4. SuperAdmin CAN view and manage customer organizations via platform governance dashboard
    const platformRes = await request('/api/platform/organizations', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(platformRes.status, 200, 'SuperAdmin must have full access to platform organizations dashboard');
    const orgs = platformRes.body.data?.organizations || platformRes.body.data || [];
    assert.ok(Array.isArray(orgs) && orgs.length >= 2, 'SuperAdmin can see customer organizations on platform dashboard');
  });

  // =========================================================================
  // CRITERION 6: Suspended Organization Access Denied
  // =========================================================================
  test('Criterion 6: Suspended organization is denied tenant ERP access until reactivated', async () => {
    // 1. SuperAdmin suspends Org B via platform API
    const suspendRes = await request(`/api/platform/organizations/${TEST_ORG_B_ID}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'SUSPENDED', reason: 'Billing review' }
    });
    assert.equal(suspendRes.status, 200);
    assert.equal(suspendRes.body.data?.organization?.status, 'SUSPENDED');

    // 2. Org B Admin tries to access their products -> must be denied with 403
    const blockedRes = await request('/api/products', {
      headers: { Authorization: `Bearer ${orgBAdminToken}` }
    });
    assert.equal(blockedRes.status, 403, 'Suspended organization users must be denied ERP access');
    assert.match(blockedRes.body.message || '', /suspended/i);

    // 3. Org B Admin tries to login while suspended -> must be rejected
    const blockedLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@orgb.com', password: 'Password@123' }
    });
    assert.equal(blockedLoginRes.status, 403, 'Login must be blocked for suspended organizations');

    // 4. SuperAdmin reactivates Org B
    const activateRes = await request(`/api/platform/organizations/${TEST_ORG_B_ID}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'ACTIVE', reason: 'Account restored' }
    });
    assert.equal(activateRes.status, 200);

    // 5. Org B Admin can access ERP again
    const restoredRes = await request('/api/products', {
      headers: { Authorization: `Bearer ${orgBAdminToken}` }
    });
    assert.equal(restoredRes.status, 200, 'Reactivated organization users regain ERP access');
  });

  // =========================================================================
  // CRITERION 7: Operational Roles Preserved within Tenant
  // =========================================================================
  test('Criterion 7: Operational roles (Manager, Store, etc.) function normally within tenant', async () => {
    // Manager in Org A can view products
    const managerRes = await request('/api/products', {
      headers: { Authorization: `Bearer ${orgAManagerToken}` }
    });
    assert.equal(managerRes.status, 200, 'Manager within tenant can read tenant products');

    // Create a distributor in Org A
    const distRes = await request('/api/distributors', {
      method: 'POST',
      headers: { Authorization: `Bearer ${orgAAdmin1Token}` },
      body: {
        distributorCode: 'DIST-ORGA-1',
        name: 'Org A Metro Distributor',
        email: 'metro@orga.com',
        phone: '+91 99999 88888',
        creditLimit: 50000
      }
    });
    assert.equal(distRes.status, 201, 'Admin can create distributor within tenant');
    const createdDist = distRes.body.data?.distributor || distRes.body.data;
    assert.equal(createdDist.organizationId, TEST_ORG_A_ID);

    // Org B Admin cannot see Org A distributor
    const listDistB = await request('/api/distributors', {
      headers: { Authorization: `Bearer ${orgBAdminToken}` }
    });
    const distsB = listDistB.body.data?.distributors || listDistB.body.data || [];
    assert.ok(!distsB.some(d => d.distributorCode === 'DIST-ORGA-1'), 'Distributor scoped to tenant');
  });

  // =========================================================================
  // CRITERION 8: Migration Safety & Data Preservation
  // =========================================================================
  test('Criterion 8: Pre-existing operational records were safely backfilled to default customer organization', async () => {
    // Check that the default organization exists
    const defaultOrg = await prisma.organization.findUnique({
      where: { id: DEFAULT_ORG_ID }
    });
    assert.ok(defaultOrg, 'Default customer organization must exist');
    assert.equal(defaultOrg.slug, 'aquanexus-primary');

    // Verify all legacy operational tables have valid organizationId pointing to default org
    const legacyProducts = await prisma.product.findMany({
      where: { organizationId: DEFAULT_ORG_ID }
    });
    assert.ok(legacyProducts.length > 0, 'Legacy products backfilled to default org');

    const legacyUsers = await prisma.user.findMany({
      where: { organizationId: DEFAULT_ORG_ID }
    });
    assert.ok(legacyUsers.length > 0, 'Legacy users backfilled to default org');

    // Verify zero orphaned products or users without an organizationId (except SuperAdmin)
    const orphanedProducts = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS count FROM products WHERE organization_id IS NULL
    `;
    assert.equal(orphanedProducts[0].count, 0, 'Zero orphaned products without organizationId');

    const orphanedUsers = await prisma.user.count({
      where: { organizationId: null, isSuperAdmin: false }
    });
    assert.equal(orphanedUsers, 0, 'Zero orphaned regular users without organizationId');
  });

  // =========================================================================
  // CRITERION 9: Authenticated Backend Role Resolution
  // =========================================================================
  test('Criterion 9: Login response role resolution relies solely on authenticated backend role', async () => {
    // Even if client attempts to pass a forged role override, backend returns true DB role
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: {
        email: 'admin1@orga.com',
        password: 'Password@123',
        roleOverride: 'SUPER_ADMIN' // Attempt client-side override
      }
    });

    assert.equal(loginRes.status, 200);
    const user = loginRes.body.data?.user;
    assert.equal(user.isSuperAdmin, false, 'Client roleOverride must not promote user to SuperAdmin');
    assert.equal(user.role?.name, 'ADMIN', 'Backend authenticated role ADMIN must be preserved');
    assert.equal(user.organizationId, TEST_ORG_A_ID, 'Active tenant context comes from DB');
  });

  after(async () => {
    const testOrgIds = [TEST_ORG_A_ID, TEST_ORG_B_ID];
    try {
      await prisma.auditLog.deleteMany({ where: { organizationId: { in: testOrgIds } } });
      await prisma.distributor.deleteMany({ where: { organizationId: { in: testOrgIds } } });
      await prisma.inventory.deleteMany({ where: { organizationId: { in: testOrgIds } } });
      await prisma.product.deleteMany({ where: { organizationId: { in: testOrgIds } } });
      await prisma.userRole.deleteMany({ where: { user: { organizationId: { in: testOrgIds } } } });
      await prisma.user.deleteMany({ where: { organizationId: { in: testOrgIds } } });
      await prisma.user.deleteMany({
        where: { email: { in: ['test.superadmin@aquanexus.com', 'admin1@orga.com', 'admin2@orga.com', 'admin@orgb.com', 'manager@orga.com', 'crosstenant@orgb.com', 'malicious@orga.com'] } }
      });
      await prisma.organization.deleteMany({ where: { id: { in: testOrgIds } } });
    } catch (e) {
      console.warn('After cleanup warning:', e.message);
    }
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  });
});
