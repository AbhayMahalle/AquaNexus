require('dotenv').config();
const prisma = require('./src/config/db.js');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Starting demo seed process...');

  // 1. Roles
  const rolesData = ['ADMIN', 'MANAGER', 'STORE_MANAGER', 'DISTRIBUTOR', 'ACCOUNTANT', 'EMPLOYEE'];
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

  const passwordHash = await bcrypt.hash('Abhay@123', 10);

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
          userRoles: {
            create: { roleId: getRole(u.role).id }
          }
        }
      });
      console.log(`Created user: ${u.username}`);
    } else {
      console.log(`User ${u.email} already exists.`);
    }
    createdUsers[u.role] = user;
  }

  // 3. Manager Assignment
  const managerUser = createdUsers['MANAGER'];
  if (managerUser) {
    const areas = ['PRODUCTION', 'STORE', 'DISTRIBUTION'];
    for (const area of areas) {
      const existing = await prisma.managerAssignment.findUnique({
        where: { userId_area: { userId: managerUser.id, area } }
      });
      if (!existing) {
        await prisma.managerAssignment.create({
          data: { userId: managerUser.id, area }
        });
        console.log(`Assigned ManagerArea ${area} to manager_demo`);
      }
    }
  }

  // 4. Departments
  const deps = [
    { name: 'Production Dept', code: 'PRD-01' },
    { name: 'Store Dept', code: 'STR-01' }
  ];
  let firstDept = null;
  for (const d of deps) {
    let dept = await prisma.department.findUnique({ where: { code: d.code } });
    if (!dept) {
      dept = await prisma.department.create({ data: d });
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

      // Attendance
      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          attendanceDate: new Date(),
          status: 'PRESENT',
          checkIn: new Date()
        }
      });

      // Leave
      await prisma.leave.create({
        data: {
          employeeId: emp.id,
          leaveType: 'SICK',
          startDate: new Date(),
          endDate: new Date(),
          reason: 'Fever',
          status: 'PENDING'
        }
      });

      // Overtime
      await prisma.overtime.create({
        data: {
          employeeId: emp.id,
          overtimeDate: new Date(),
          hours: 2.5,
          reason: 'Machine Repair',
          status: 'PENDING'
        }
      });
    }
  }

  // 6. Product & Inventory
  let product = await prisma.product.findUnique({ where: { sku: 'AQ-1L-BOT' } });
  if (!product) {
    product = await prisma.product.create({
      data: {
        sku: 'AQ-1L-BOT',
        name: 'AquaNexus 1L Bottle',
        category: 'BOTTLE',
        unit: 'Box',
        sellingPrice: 120,
        costPrice: 80,
        minimumStock: 50,
        inventory: {
          create: { quantity: 500, reorderLevel: 50 }
        }
      }
    });
    console.log('Created demo product and inventory');
  }

  // 7. Sales Area & Distributor
  let salesArea = await prisma.salesArea.findUnique({ where: { code: 'SA-NORTH' } });
  if (!salesArea) {
    salesArea = await prisma.salesArea.create({
      data: { name: 'North Region', code: 'SA-NORTH' }
    });
  }

  const distUser = createdUsers['DISTRIBUTOR'];
  let distributor = await prisma.distributor.findUnique({ where: { distributorCode: 'DIST-001' } });
  if (!distributor) {
    distributor = await prisma.distributor.create({
      data: {
        distributorCode: 'DIST-001',
        name: 'NorthWest Suppliers',
        email: distUser.email,
        salesAreaId: salesArea.id,
        userDistributors: {
          create: { userId: distUser.id }
        }
      }
    });
    console.log('Created demo distributor and linked to dist_demo');
  }

  // 8. Supplier
  let supplier = await prisma.supplier.findUnique({ where: { supplierCode: 'SUP-001' } });
  if (!supplier) {
    supplier = await prisma.supplier.create({
      data: { supplierCode: 'SUP-001', name: 'Raw Materials Co', email: 'raw@example.com' }
    });
    console.log('Created demo supplier');
  }

  // 9. Demo Audit Log
  const adminUser = createdUsers['ADMIN'];
  await prisma.auditLog.create({
    data: {
      user: { connect: { id: adminUser.id } },
      action: 'SYSTEM_SEED',
      entityType: 'SYSTEM',
      entityId: '0',
      oldValues: {},
      newValues: { message: 'Seed executed successfully' },
      ipAddress: '127.0.0.1'
    }
  });

  // 10. Notification for everyone
  for (const role in createdUsers) {
    await prisma.notification.create({
      data: {
        user: { connect: { id: createdUsers[role].id } },
        title: 'Welcome to AquaNexus',
        message: 'This is a demo notification generated by the seed script.',
        type: 'INFO'
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
