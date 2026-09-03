const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const rolesToCreate = ['ADMIN', 'MANAGER', 'STORE_MANAGER', 'ACCOUNTANT', 'DISTRIBUTOR'];
  const roles = {};

  for (const roleName of rolesToCreate) {
    roles[roleName] = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `System ${roleName} role` },
    });
    console.log(`Upserted role: ${roleName}`);
  }

  // 2. Permissions
  const permissionsToCreate = [
    'employee.view', 'employee.create', 'employee.update', 'employee.delete',
    'attendance.view', 'attendance.create', 'attendance.update',
    'production.view', 'production.create', 'production.update',
    'inventory.view', 'inventory.create', 'inventory.update',
    'order.view', 'order.create', 'order.update',
    'payroll.view', 'payroll.manage',
    'payment.view', 'payment.create',
    'report.view'
  ];
  
  const permissions = {};
  for (const perm of permissionsToCreate) {
    permissions[perm] = await prisma.permission.upsert({
      where: { name: perm },
      update: {},
      create: { name: perm },
    });
  }
  console.log(`Upserted ${permissionsToCreate.length} permissions`);

  // 3. Assign all permissions to ADMIN role
  const adminRole = roles['ADMIN'];
  for (const perm of Object.values(permissions)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id
      }
    });
  }
  console.log('Assigned all permissions to ADMIN role');

  // 4. Create default ADMIN user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@aquanexus.com' },
    update: {},
    create: {
      email: 'admin@aquanexus.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      roleId: adminRole.id
    }
  });
  console.log(`Upserted default admin user: ${adminUser.email}`);
  
  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
