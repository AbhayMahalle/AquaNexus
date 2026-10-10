/**
 * AquaNexus SaaS Transformation Automated Verification Test Suite
 *
 * Verifies Tests A through J:
 * - Test A: Super Admin login, dashboard stats, profile, plan listing, company listing
 * - Test B: Super Admin onboards customer company (Company A) with Basic plan
 * - Test C: Company A Admin login and company subscription/profile access
 * - Test D: Company A Admin creates 1 business user (manager) within limit
 * - Test E: Company A Admin attempts to create 2nd user -> REJECTED with 403 limit exceeded
 * - Test F: Super Admin upgrades Company A to Pro plan
 * - Test G: Company A Admin creates additional users up to Pro limit
 * - Test H: Super Admin onboards Company B with Pro Max custom limits
 * - Test I: Tenant data isolation between Company A and Company B
 * - Test J: Suspended / Expired subscription blocks mutating actions
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

// Fixture constants with unique timestamps to prevent clashes
const TIMESTAMP = Date.now();
const COMPANY_A_SLUG = `saas-comp-a-${TIMESTAMP}`;
const COMPANY_B_SLUG = `saas-comp-b-${TIMESTAMP}`;

let superAdminToken;
let compAAdminToken;
let compBAdminToken;
let compAId;
let compBId;
let basicPlanId;
let proPlanId;
let proMaxPlanId;

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
    // not JSON
  }
  return { status: res.status, headers: res.headers, body: json, text };
}

describe('AquaNexus SaaS Transformation Verification Suite (Aazira Solution)', () => {
  before(async () => {
    // Start local test server
    server = http.createServer(app);
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    });

    // Ensure plans exist
    const plans = await prisma.subscriptionPlan.findMany();
    const basic = plans.find(p => p.code === 'BASIC');
    const pro = plans.find(p => p.code === 'PRO');
    const proMax = plans.find(p => p.code === 'PRO_MAX');

    basicPlanId = basic ? basic.id : null;
    proPlanId = pro ? pro.id : null;
    proMaxPlanId = proMax ? proMax.id : null;

    assert.ok(basicPlanId, 'Basic plan must exist in DB');
    assert.ok(proPlanId, 'Pro plan must exist in DB');
    assert.ok(proMaxPlanId, 'Pro Max plan must exist in DB');

    // Ensure SuperAdmin exists
    const superAdminRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN' } });
    assert.ok(superAdminRole, 'SUPER_ADMIN role must exist');

    let superAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { isSuperAdmin: true },
          { userRoles: { some: { role: { name: 'SUPER_ADMIN' } } } },
          { email: 'superadmin@aquanexus.com' }
        ]
      }
    });

    const testPassword = 'SuperAdminSecurePass@123';
    const passwordHash = await bcrypt.hash(testPassword, 10);

    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          username: `superadmin_test_${TIMESTAMP}`,
          email: `superadmin_test_${TIMESTAMP}@aquanexus.com`,
          passwordHash,
          isSuperAdmin: true,
          superAdminSlot: 'PRIMARY',
          organizationId: null,
          status: 'ACTIVE',
          userRoles: {
            create: { roleId: superAdminRole.id }
          }
        }
      });
    } else {
      await prisma.user.update({
        where: { id: superAdmin.id },
        data: { passwordHash }
      });
    }

    // Login as SuperAdmin
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: superAdmin.email, password: testPassword }
    });

    assert.strictEqual(loginRes.status, 200, 'SuperAdmin login should succeed');
    superAdminToken = loginRes.body?.data?.token || loginRes.body?.token;
    assert.ok(superAdminToken, 'SuperAdmin token must be returned');
  });

  after(async () => {
    // Cleanup created test companies
    try {
      const orgIds = [compAId, compBId].filter(Boolean);
      for (const orgId of orgIds) {
        await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
        await prisma.userRole.deleteMany({ where: { user: { organizationId: orgId } } });
        await prisma.employee.deleteMany({ where: { organizationId: orgId } });
        await prisma.user.deleteMany({ where: { organizationId: orgId } });
        await prisma.department.deleteMany({ where: { organizationId: orgId } });
        await prisma.companySubscription.deleteMany({ where: { organizationId: orgId } });
        await prisma.organization.deleteMany({ where: { id: orgId } });
      }
    } catch (e) {
      console.warn('Cleanup error:', e.message);
    }

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // TEST A
  test('Test A: Platform Super Admin login, dashboard stats, profile, plan listing, company listing', async () => {
    // Stats
    const statsRes = await request('/platform/stats', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(statsRes.status, 200);
    assert.ok(statsRes.body?.data?.metrics, 'Should return platform metrics');
    assert.ok(typeof statsRes.body.data.metrics.totalCompanies === 'number');

    // Profile
    const profileRes = await request('/platform/profile', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(profileRes.status, 200);
    assert.strictEqual(profileRes.body?.data?.profile?.role, 'super_admin');

    // Plans
    const plansRes = await request('/platform/plans', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(plansRes.status, 200);
    const plans = plansRes.body?.data?.plans;
    assert.ok(Array.isArray(plans));
    assert.ok(plans.some(p => p.code === 'BASIC'));
    assert.ok(plans.some(p => p.code === 'PRO'));
    assert.ok(plans.some(p => p.code === 'PRO_MAX'));

    // Organizations
    const orgsRes = await request('/platform/organizations', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(orgsRes.status, 200);
    assert.ok(Array.isArray(orgsRes.body?.data?.organizations));
  });

  // TEST B
  test('Test B: Super Admin onboards Company A with Basic plan (limit: 1 created business role)', async () => {
    const adminEmail = `admin_a_${TIMESTAMP}@companya.com`;
    const adminPassword = 'CompanyAPassword@123';

    const onboardRes = await request('/platform/organizations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: `Company A ${TIMESTAMP}`,
        slug: COMPANY_A_SLUG,
        contactEmail: adminEmail,
        contactPhone: '+91 9876543210',
        address: '100 Industrial Area, Mumbai',
        city: 'Mumbai',
        state: 'Maharashtra',
        planCode: 'BASIC',
        adminFirstName: 'Rajesh',
        adminLastName: 'Kumar',
        adminUsername: `admin_a_${TIMESTAMP}`,
        adminEmail: adminEmail,
        adminPassword: adminPassword,
      }
    });

    assert.strictEqual(onboardRes.status, 201, `Failed to onboard Company A: ${JSON.stringify(onboardRes.body)}`);
    compAId = onboardRes.body?.data?.organization?.id;
    assert.ok(compAId, 'Company A ID must be created');

    // Verify subscription was created with BASIC plan
    const sub = await prisma.companySubscription.findFirst({
      where: { organizationId: compAId },
      include: { plan: true }
    });
    assert.ok(sub, 'Subscription must exist for Company A');
    assert.strictEqual(sub.plan.code, 'BASIC');
    assert.strictEqual(sub.plan.maxUsers, 1);
  });

  // TEST C
  test('Test C: Company A Admin login and company subscription/profile access', async () => {
    const adminEmail = `admin_a_${TIMESTAMP}@companya.com`;
    const adminPassword = 'CompanyAPassword@123';

    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword }
    });

    assert.strictEqual(loginRes.status, 200, `Company A Admin login failed: ${JSON.stringify(loginRes.body)}`);
    compAAdminToken = loginRes.body?.data?.token || loginRes.body?.token;
    assert.ok(compAAdminToken, 'Company A Admin token must be issued');

    // Access Company Subscription
    const subRes = await request('/company/subscription', {
      headers: { Authorization: `Bearer ${compAAdminToken}` }
    });
    assert.strictEqual(subRes.status, 200);
    assert.strictEqual(subRes.body?.data?.subscription?.plan?.code, 'BASIC');
    const limitA = subRes.body?.data?.subscription?.limits?.maxCreatedUsers ?? subRes.body?.data?.subscription?.maxUsers;
    assert.strictEqual(limitA, 1);

    // Access Company Profile
    const profileRes = await request('/company/profile', {
      headers: { Authorization: `Bearer ${compAAdminToken}` }
    });
    assert.strictEqual(profileRes.status, 200);
    const compSlug = profileRes.body?.data?.organization?.slug || profileRes.body?.data?.company?.slug;
    assert.strictEqual(compSlug, COMPANY_A_SLUG);
  });

  // TEST D: Basic plan allows 1 user per business role
  test('Test D: Company A Admin successfully creates 1 business user (manager)', async () => {
    const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });
    assert.ok(managerRole, 'Manager role must exist');

    const createRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAAdminToken}` },
      body: {
        username: `mgr1_a_${TIMESTAMP}`,
        email: `manager1_a_${TIMESTAMP}@companya.com`,
        password: 'MgrPassword@123',
        firstName: 'Anil',
        lastName: 'Patil',
        roleId: managerRole.id
      }
    });

    assert.strictEqual(createRes.status, 201, `Failed to create 1st manager: ${JSON.stringify(createRes.body)}`);
    assert.ok(createRes.body?.data?.user?.id);
  });

  // TEST E: Basic plan rejects 2nd user for the same business role
  test('Test E: Company A Admin attempts to create 2nd manager -> REJECTED with 403', async () => {
    const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });

    const createRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAAdminToken}` },
      body: {
        username: `mgr2_a_${TIMESTAMP}`,
        email: `manager2_a_${TIMESTAMP}@companya.com`,
        password: 'MgrPassword@123',
        firstName: 'Sunil',
        lastName: 'Rao',
        roleId: managerRole.id
      }
    });

    assert.strictEqual(createRes.status, 403, 'Should reject 2nd manager on Basic plan with HTTP 403');
    const errMsg = createRes.body?.error || createRes.body?.message || '';
    assert.ok(
      errMsg.toLowerCase().includes('limit') || errMsg.toLowerCase().includes('manager'),
      `Expected role limit message, got: ${errMsg}`
    );
  });

  // TEST E1: Basic plan allows 1 user for a DIFFERENT business role (Accountant)
  test('Test E1: Company A Admin creates 1 accountant -> SUCCEEDS (separate business role)', async () => {
    const accountantRole = await prisma.role.findFirst({ where: { name: 'ACCOUNTANT' } });
    assert.ok(accountantRole, 'Accountant role must exist');

    const createRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAAdminToken}` },
      body: {
        username: `acct1_a_${TIMESTAMP}`,
        email: `accountant1_a_${TIMESTAMP}@companya.com`,
        password: 'AcctPassword@123',
        firstName: 'Ramesh',
        lastName: 'Deshmukh',
        roleId: accountantRole.id
      }
    });

    assert.strictEqual(createRes.status, 201, `Failed to create accountant: ${JSON.stringify(createRes.body)}`);
    assert.ok(createRes.body?.data?.user?.id);

    // 2nd Accountant must be rejected
    const rejectRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAAdminToken}` },
      body: {
        username: `acct2_a_${TIMESTAMP}`,
        email: `accountant2_a_${TIMESTAMP}@companya.com`,
        password: 'AcctPassword@123',
        firstName: 'Suresh',
        lastName: 'Deshmukh',
        roleId: accountantRole.id
      }
    });
    assert.strictEqual(rejectRes.status, 403, 'Should reject 2nd accountant on Basic plan');
  });

  // TEST E2: Employees are UNLIMITED in every plan and never consume quota
  test('Test E2: Company A Admin creates multiple employees -> ALL SUCCEED (unlimited employees)', async () => {
    const employeeRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
    assert.ok(employeeRole, 'Employee role must exist');

    for (let i = 1; i <= 3; i++) {
      const createRes = await request('/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${compAAdminToken}` },
        body: {
          username: `emp${i}_a_${TIMESTAMP}`,
          email: `employee${i}_a_${TIMESTAMP}@companya.com`,
          password: 'EmpPassword@123',
          firstName: `Staff${i}`,
          lastName: 'Worker',
          roleId: employeeRole.id
        }
      });
      assert.strictEqual(createRes.status, 201, `Employee #${i} creation must succeed: ${JSON.stringify(createRes.body)}`);
    }
  });

  // TEST E3: Exactly 1 company Admin allowed per company in every plan
  test('Test E3: Attempting to create a second Admin in Company A -> REJECTED with 403', async () => {
    const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
    assert.ok(adminRole, 'Admin role must exist');

    const createAdminRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAAdminToken}` },
      body: {
        username: `admin2_a_${TIMESTAMP}`,
        email: `admin2_a_${TIMESTAMP}@companya.com`,
        password: 'AdminPassword@123',
        firstName: 'Second',
        lastName: 'Admin',
        roleId: adminRole.id
      }
    });

    assert.strictEqual(createAdminRes.status, 403, 'Should reject 2nd company Admin with HTTP 403');
    const errMsg = createAdminRes.body?.error || createAdminRes.body?.message || '';
    assert.ok(
      errMsg.toLowerCase().includes('admin') && errMsg.toLowerCase().includes('1'),
      `Expected single-admin message, got: ${errMsg}`
    );
  });

  // TEST E4: Role changes cannot bypass limits
  test('Test E4: Updating an Employee role to Manager when Manager is at limit -> REJECTED with 403', async () => {
    const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });
    const employee = await prisma.user.findFirst({
      where: {
        organizationId: compAId,
        email: `employee1_a_${TIMESTAMP}@companya.com`
      }
    });
    assert.ok(employee, 'Employee must exist');

    const updateRes = await request(`/users/${employee.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${compAAdminToken}` },
      body: {
        roleId: managerRole.id
      }
    });

    assert.strictEqual(updateRes.status, 403, 'Should reject promoting employee to manager when manager limit reached');
  });

  // TEST E5: Concurrency safety
  test('Test E5: Concurrent requests attempting to create 2nd manager safely respect limit', async () => {
    const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });

    // Send two simultaneous user creation requests for Manager
    const [res1, res2] = await Promise.all([
      request('/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${compAAdminToken}` },
        body: {
          username: `concurrent_mgr1_${TIMESTAMP}`,
          email: `concurrent_mgr1_${TIMESTAMP}@companya.com`,
          password: 'Password@123',
          firstName: 'Concurrent1',
          lastName: 'Test',
          roleId: managerRole.id
        }
      }),
      request('/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${compAAdminToken}` },
        body: {
          username: `concurrent_mgr2_${TIMESTAMP}`,
          email: `concurrent_mgr2_${TIMESTAMP}@companya.com`,
          password: 'Password@123',
          firstName: 'Concurrent2',
          lastName: 'Test',
          roleId: managerRole.id
        }
      })
    ]);

    // Since Company A already has 1 manager, BOTH concurrent attempts MUST be rejected with 403
    assert.strictEqual(res1.status, 403, 'Concurrent request 1 must be rejected with 403');
    assert.strictEqual(res2.status, 403, 'Concurrent request 2 must be rejected with 403');
  });

  // TEST F: Super Admin upgrades Company A to Pro plan
  test('Test F: Super Admin upgrades Company A to Pro plan (limit: 5 users per business role)', async () => {
    const upgradeRes = await request(`/platform/organizations/${compAId}/subscription`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        planId: proPlanId,
        billingCycle: 'MONTHLY'
      }
    });

    assert.strictEqual(upgradeRes.status, 200, `Failed to upgrade Company A: ${JSON.stringify(upgradeRes.body)}`);
    assert.strictEqual(upgradeRes.body?.data?.subscription?.plan?.code, 'PRO');

    // Company A Admin verifies upgraded limits
    const subRes = await request('/company/subscription', {
      headers: { Authorization: `Bearer ${compAAdminToken}` }
    });
    assert.strictEqual(subRes.status, 200);
    assert.strictEqual(subRes.body?.data?.subscription?.plan?.code, 'PRO');
    const mgrLimit = subRes.body?.data?.subscription?.roleLimits?.MANAGER?.maxLimit;
    assert.strictEqual(mgrLimit, 5, 'Pro plan manager limit must be 5');
  });

  // TEST G: Pro plan allows up to 5 users per each business role
  test('Test G: Company A Admin creates additional managers up to 5 total Managers', async () => {
    const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });

    // Company A already has 1 Manager. Now create 4 more to reach 5.
    for (let i = 2; i <= 5; i++) {
      const res = await request('/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${compAAdminToken}` },
        body: {
          username: `mgr${i}_a_${TIMESTAMP}`,
          email: `manager${i}_a_${TIMESTAMP}@companya.com`,
          password: 'MgrPassword@123',
          firstName: `Manager${i}`,
          lastName: 'Test',
          roleId: managerRole.id
        }
      });
      assert.strictEqual(res.status, 201, `Failed to create Manager #${i}: ${JSON.stringify(res.body)}`);
    }

    // Attempting 6th Manager must be rejected by Pro limit
    const rejectRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAAdminToken}` },
      body: {
        username: `mgr6_a_${TIMESTAMP}`,
        email: `manager6_a_${TIMESTAMP}@companya.com`,
        password: 'MgrPassword@123',
        firstName: 'Exceeded',
        lastName: 'Manager',
        roleId: managerRole.id
      }
    });
    assert.strictEqual(rejectRes.status, 403, 'Should reject 6th manager on Pro plan with HTTP 403');
  });

  // TEST H: Pro Max plan allows independent custom limits per business role
  test('Test H: Super Admin configures Company B with Pro Max independent role limits', async () => {
    const adminEmail = `admin_b_${TIMESTAMP}@companyb.com`;
    const adminPassword = 'CompanyBPassword@123';

    // 1. Onboard Company B
    const onboardRes = await request('/platform/organizations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        name: `Company B ${TIMESTAMP}`,
        slug: COMPANY_B_SLUG,
        contactEmail: adminEmail,
        contactPhone: '+91 9123456789',
        address: '500 Tech Park, Bengaluru',
        city: 'Bengaluru',
        state: 'Karnataka',
        planCode: 'PRO_MAX',
        customPrice: 7999,
        adminFirstName: 'Deepak',
        adminLastName: 'Varma',
        adminUsername: `admin_b_${TIMESTAMP}`,
        adminEmail: adminEmail,
        adminPassword: adminPassword,
      }
    });

    assert.strictEqual(onboardRes.status, 201, `Failed to onboard Company B: ${JSON.stringify(onboardRes.body)}`);
    compBId = onboardRes.body?.data?.organization?.id;
    assert.ok(compBId);

    // 2. Super Admin assigns Pro Max with independent custom limits: MANAGER: 2, ACCOUNTANT: 3
    const assignRes = await request('/platform/subscriptions/assign', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: {
        companyId: compBId,
        planCode: 'PRO_MAX',
        roleLimits: {
          MANAGER: 2,
          ACCOUNTANT: 3
        },
        customPrice: 7999,
        durationDays: 30
      }
    });
    assert.strictEqual(assignRes.status, 200, `Failed to assign custom Pro Max limits: ${JSON.stringify(assignRes.body)}`);

    // 3. Login as Company B Admin
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: { email: adminEmail, password: adminPassword }
    });
    assert.strictEqual(loginRes.status, 200);
    compBAdminToken = loginRes.body?.data?.token || loginRes.body?.token;
    assert.ok(compBAdminToken);

    // 4. Verify Company B subscription reflects custom independent role limits
    const subRes = await request('/company/subscription', {
      headers: { Authorization: `Bearer ${compBAdminToken}` }
    });
    assert.strictEqual(subRes.status, 200);
    assert.strictEqual(subRes.body?.data?.subscription?.plan?.code, 'PRO_MAX');
    assert.strictEqual(subRes.body?.data?.subscription?.roleLimits?.MANAGER?.maxLimit, 2);
    assert.strictEqual(subRes.body?.data?.subscription?.roleLimits?.ACCOUNTANT?.maxLimit, 3);

    // 5. Test Manager limit for Company B: exactly 2 allowed, 3rd rejected
    const managerRole = await prisma.role.findFirst({ where: { name: 'MANAGER' } });
    for (let i = 1; i <= 2; i++) {
      const res = await request('/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${compBAdminToken}` },
        body: {
          username: `b_mgr${i}_${TIMESTAMP}`,
          email: `b_manager${i}_${TIMESTAMP}@companyb.com`,
          password: 'Password@123',
          firstName: `BMgr${i}`,
          lastName: 'User',
          roleId: managerRole.id
        }
      });
      assert.strictEqual(res.status, 201, `Company B Manager #${i} must succeed`);
    }

    const bRejectMgr = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compBAdminToken}` },
      body: {
        username: `b_mgr3_${TIMESTAMP}`,
        email: `b_manager3_${TIMESTAMP}@companyb.com`,
        password: 'Password@123',
        firstName: 'Exceeded',
        lastName: 'User',
        roleId: managerRole.id
      }
    });
    assert.strictEqual(bRejectMgr.status, 403, '3rd Manager in Company B must be rejected under custom limit of 2');
  });

  // TEST I
  test('Test I: Strict tenant data isolation between Company A and Company B', async () => {
    // 1. Company A Admin querying users gets only Company A users
    const usersARes = await request('/users', {
      headers: { Authorization: `Bearer ${compAAdminToken}` }
    });
    assert.strictEqual(usersARes.status, 200);
    const usersA = usersARes.body?.data?.users || usersARes.body?.users || [];
    assert.ok(usersA.length > 0);
    for (const u of usersA) {
      assert.strictEqual(u.organizationId, compAId, 'All returned users must belong to Company A');
    }

    // 2. Company B Admin querying users gets only Company B users
    const usersBRes = await request('/users', {
      headers: { Authorization: `Bearer ${compBAdminToken}` }
    });
    assert.strictEqual(usersBRes.status, 200);
    const usersB = usersBRes.body?.data?.users || usersBRes.body?.users || [];
    assert.ok(usersB.length > 0);
    for (const u of usersB) {
      assert.strictEqual(u.organizationId, compBId, 'All returned users must belong to Company B');
    }

    // 3. Verify zero cross-tenant contamination: none of A's users are in B's list
    const aUserIds = new Set(usersA.map(u => u.id));
    for (const u of usersB) {
      assert.strictEqual(aUserIds.has(u.id), false, 'Company B must never see any Company A user ID');
    }

    // 4. Verify Company A cannot access Company B's organization profile
    const profileRes = await request('/company/profile', {
      headers: { Authorization: `Bearer ${compAAdminToken}` }
    });
    const orgId = profileRes.body?.data?.organization?.id || profileRes.body?.data?.company?.id;
    assert.strictEqual(orgId, compAId);
    assert.notStrictEqual(orgId, compBId);
  });

  // TEST J
  test('Test J: Suspended or expired subscription blocks mutating actions', async () => {
    // Super Admin suspends Company B's subscription
    const suspendRes = await request(`/platform/subscriptions/${compBId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'SUSPENDED' }
    });
    assert.strictEqual(suspendRes.status, 200);

    // Company B Admin attempts to create a user -> BLOCKED by tenant middleware
    const employeeRole = await prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
    const mutateRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compBAdminToken}` },
      body: {
        username: `blocked_emp_${TIMESTAMP}`,
        email: `blocked_${TIMESTAMP}@companyb.com`,
        password: 'EmpPassword@123',
        firstName: 'Blocked',
        lastName: 'User',
        roleId: employeeRole.id
      }
    });

    assert.strictEqual(mutateRes.status, 403, 'Mutating action should be blocked with 403 on suspended subscription');
    const errMsg = mutateRes.body?.error || mutateRes.body?.message || '';
    assert.ok(
      errMsg.toLowerCase().includes('subscription') ||
      errMsg.toLowerCase().includes('suspended') ||
      errMsg.toLowerCase().includes('inactive'),
      `Expected subscription suspension message, got: ${errMsg}`
    );

    // Reactivate Company B's subscription
    const reactivateRes = await request(`/platform/subscriptions/${compBId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: { status: 'ACTIVE' }
    });
    assert.strictEqual(reactivateRes.status, 200);

    // Mutating action is restored and works now
    const unblockedRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compBAdminToken}` },
      body: {
        username: `unblocked_emp_${TIMESTAMP}`,
        email: `unblocked_${TIMESTAMP}@companyb.com`,
        password: 'EmpPassword@123',
        firstName: 'Unblocked',
        lastName: 'User',
        roleId: employeeRole.id
      }
    });
    assert.strictEqual(unblockedRes.status, 201, 'Mutating action should succeed after reactivation');
  });

  // TEST K: Vendor/Supplier role has role limit enforcement
  test('Test K: Vendor/Supplier role is enforced under subscription plan', async () => {
    const supplierRole = await prisma.role.findFirst({ where: { name: 'SUPPLIER' } });
    
    assert.ok(supplierRole, 'SUPPLIER role must exist');

    // Create 1 Supplier
    const createSupplierRes = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${compAAdminToken}` },
      body: {
        username: `supplier1_a_${TIMESTAMP}`,
        email: `supplier1_a_${TIMESTAMP}@companya.com`,
        password: 'Password@123',
        firstName: 'Suppy',
        lastName: 'Supplier',
        roleId: supplierRole.id
      }
    });
    assert.strictEqual(createSupplierRes.status, 201, `Failed to create Vendor/Supplier: ${JSON.stringify(createSupplierRes.body)}`);

    // Fetch subscription usage and limits
    const subRes = await request('/company/subscription', {
      headers: { Authorization: `Bearer ${compAAdminToken}` }
    });
    const limits = subRes.body?.data?.subscription?.roleLimits || {};
    
    assert.ok(limits.SUPPLIER, 'SUPPLIER limit must be present');
    assert.strictEqual(limits.SUPPLIER.currentUsage, 1, 'Vendor/Supplier usage should be 1');
  });
});
