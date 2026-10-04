require('dotenv').config();
const prisma = require('./src/config/db.js');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Starting reconciled demo seed process...');

  // 0. Default Organization
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'aquanexus-primary' },
    update: {},
    create: {
      id: 'd0000000-0000-4000-8000-000000000001',
      name: 'AquaNexus Primary Plant',
      slug: 'aquanexus-primary',
      status: 'ACTIVE'
    }
  });

  // 1. Roles
  const rolesData = ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STORE_MANAGER', 'DISTRIBUTOR', 'ACCOUNTANT', 'EMPLOYEE'];
  for (const roleName of rolesData) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `${roleName} Role` }
    });
  }
  const roles = await prisma.role.findMany();
  const getRole = (name) => roles.find(r => r.name === name);

  // 2. Demo Users
  const usersToCreate = [
    { username: 'admin_demo', email: 'admin@aquanexus.com', firstName: 'Admin', lastName: 'User', role: 'ADMIN' },
    { username: 'manager_demo', email: 'manager@aquanexus.com', firstName: 'Manager', lastName: 'User', role: 'MANAGER' },
    { username: 'store_demo', email: 'store@aquanexus.com', firstName: 'Store', lastName: 'Manager', role: 'STORE_MANAGER' },
    { username: 'dist_demo', email: 'distributor@aquanexus.com', firstName: 'Dist', lastName: 'User', role: 'DISTRIBUTOR' },
    { username: 'account_demo', email: 'accountant@aquanexus.com', firstName: 'Account', lastName: 'User', role: 'ACCOUNTANT' },
    { username: 'emp_demo', email: 'employee@aquanexus.com', firstName: 'Employee', lastName: 'User', role: 'EMPLOYEE' },
  ];

  const passwordHash = await bcrypt.hash('Password@123', 10);

  const createdUsers = {};
  for (const u of usersToCreate) {
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: u.username,
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          passwordHash,
          organizationId: defaultOrg.id,
          userRoles: {
            create: { roleId: getRole(u.role).id }
          }
        }
      });
      console.log(`Created user: ${u.username}`);
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: defaultOrg.id }
      });
    }
    createdUsers[u.role] = user;
  }

  // Ensure singleton SuperAdmin exists
  let superAdminUser = await prisma.user.findFirst({
    where: { isSuperAdmin: true }
  });
  if (!superAdminUser) {
    superAdminUser = await prisma.user.create({
      data: {
        username: 'superadmin',
        email: 'superadmin@aquanexus.com',
        firstName: 'AquaNexus',
        lastName: 'SuperAdmin',
        passwordHash,
        isSuperAdmin: true,
        superAdminSlot: 'SUPER_ADMIN',
        organizationId: null,
        userRoles: {
          create: { roleId: getRole('SUPER_ADMIN').id }
        }
      }
    });
    console.log('Created singleton SuperAdmin user');
  }

  // 3. Manager Assignment
  const managerUser = createdUsers['MANAGER'];
  if (managerUser) {
    const areas = ['PRODUCTION', 'STORE', 'DISTRIBUTION'];
    for (const area of areas) {
      await prisma.managerAssignment.upsert({
        where: { userId_area: { userId: managerUser.id, area } },
        update: {},
        create: { userId: managerUser.id, area }
      });
    }
  }

  // 4. Departments
  const deps = [
    { name: 'Production Dept', code: 'PRD-01' },
    { name: 'Store Dept', code: 'STR-01' }
  ];
  let firstDept = null;
  for (const d of deps) {
    let dept = await prisma.department.findUnique({
      where: { organizationId_code: { organizationId: defaultOrg.id, code: d.code } }
    });
    if (!dept) {
      dept = await prisma.department.create({
        data: { ...d, organizationId: defaultOrg.id }
      });
      console.log(`Created department: ${d.name}`);
    }
    if (!firstDept) firstDept = dept;
  }

  // 5. Employee Profile for the Employee User
  const empUser = createdUsers['EMPLOYEE'];
  if (empUser && firstDept) {
    let emp = await prisma.employee.findUnique({ where: { userId: empUser.id } });
    if (!emp) {
      emp = await prisma.employee.create({
        data: {
          organizationId: defaultOrg.id,
          employeeCode: 'EMP-999',
          userId: empUser.id,
          firstName: empUser.firstName,
          lastName: empUser.lastName,
          departmentId: firstDept.id,
          designation: 'Technician',
          joiningDate: new Date(),
          employmentType: 'PERMANENT'
        }
      });
      console.log('Created employee profile for emp_demo');
    }
  }

  // 6. Product & Inventory
  let product = await prisma.product.findUnique({
    where: { organizationId_sku: { organizationId: defaultOrg.id, sku: 'AQ-1L-BOT' } }
  });
  if (!product) {
    product = await prisma.product.create({
      data: {
        organizationId: defaultOrg.id,
        sku: 'AQ-1L-BOT',
        name: 'AquaNexus 1L Bottle',
        category: 'BOTTLE',
        unit: 'Box',
        sellingPrice: 120,
        costPrice: 80,
        minimumStock: 50,
        inventory: {
          create: {
            organizationId: defaultOrg.id,
            quantity: 500,
            reorderLevel: 50
          }
        }
      }
    });
    console.log('Created demo product and inventory');
  }

  console.log('Demo seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
