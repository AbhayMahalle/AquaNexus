require("dotenv").config({
  path: process.env.DOTENV_CONFIG_PATH || ".env",
});
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌊 AquaNexus — Seeding database...\n");

  // ============================================================
  // 0. DEFAULT CUSTOMER ORGANIZATION
  // ============================================================
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: "aquanexus-primary" },
    update: {},
    create: {
      id: "d0000000-0000-4000-8000-000000000001",
      name: "AquaNexus Primary Plant",
      slug: "aquanexus-primary",
      status: "ACTIVE",
    },
  });
  console.log(`✅ Organization: ${defaultOrg.name} (${defaultOrg.id})`);

  // ============================================================
  // 1. ROLES
  // ============================================================
  const roleData = [
    {
      name: "SUPER_ADMIN",
      description: "Global access across all customer organizations",
    },
    {
      name: "ADMIN",
      description: "Full access within the customer's organization",
    },
    { name: "MANAGER", description: "Operational management" },
    { name: "STORE_MANAGER", description: "Store and inventory management" },
    { name: "ACCOUNTANT", description: "Finance and accounting" },
    { name: "DISTRIBUTOR", description: "Distributor portal access" },
    { name: "EMPLOYEE", description: "Employee access" },
  ];

  const roles = {};
  for (const r of roleData) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }
  console.log(`✅ Roles: ${Object.keys(roles).join(", ")}`);

  // ============================================================
  // 2. PERMISSIONS
  // ============================================================
  const permissionData = [
    // Employee
    { code: "employee.view", name: "View Employees" },
    { code: "employee.create", name: "Create Employees" },
    { code: "employee.update", name: "Update Employees" },
    { code: "employee.delete", name: "Delete Employees" },
    // Attendance
    { code: "attendance.view", name: "View Attendance" },
    { code: "attendance.create", name: "Create Attendance" },
    { code: "attendance.update", name: "Update Attendance" },
    // Production
    { code: "production.view", name: "View Production" },
    { code: "production.create", name: "Create Production" },
    { code: "production.update", name: "Update Production" },
    // Inventory
    { code: "inventory.view", name: "View Inventory" },
    { code: "inventory.manage", name: "Manage Inventory" },
    // Order
    { code: "order.view", name: "View Orders" },
    { code: "order.create", name: "Create Orders" },
    { code: "order.update", name: "Update Orders" },
    // Dispatch
    { code: "dispatch.view", name: "View Dispatches" },
    { code: "dispatch.create", name: "Create Dispatches" },
    // Invoice
    { code: "invoice.view", name: "View Invoices" },
    { code: "invoice.create", name: "Create Invoices" },
    // Payment
    { code: "payment.view", name: "View Payments" },
    { code: "payment.manage", name: "Manage Payments" },
    // Payroll
    { code: "payroll.view", name: "View Payroll" },
    { code: "payroll.manage", name: "Manage Payroll" },
    // Reports
    { code: "report.view", name: "View Reports" },
    // Sales
    { code: "sales.view", name: "View Sales" },
    { code: "sales.create", name: "Create Sales" },
    // Returns
    { code: "return.view", name: "View Returns" },
    { code: "return.create", name: "Create Returns" },
    // Expense
    { code: "expense.view", name: "View Expenses" },
    { code: "expense.manage", name: "Manage Expenses" },
  ];

  const permissions = {};
  for (const p of permissionData) {
    permissions[p.code] = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log(`✅ Permissions: ${permissionData.length} created`);

  // ============================================================
  // 3. ROLE-PERMISSION MAPPINGS
  // ============================================================
  const allPermIds = Object.values(permissions).map((p) => p.id);
  for (const pid of allPermIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: roles.ADMIN.id, permissionId: pid },
      },
      update: {},
      create: { roleId: roles.ADMIN.id, permissionId: pid },
    });
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: roles.SUPER_ADMIN.id, permissionId: pid },
      },
      update: {},
      create: { roleId: roles.SUPER_ADMIN.id, permissionId: pid },
    });
  }

  const managerPerms = [
    "employee.view", "employee.create", "employee.update",
    "attendance.view", "attendance.create", "attendance.update",
    "production.view", "production.create", "production.update",
    "inventory.view", "inventory.manage",
    "order.view", "order.create", "order.update",
    "dispatch.view", "dispatch.create",
    "report.view",
  ];
  for (const code of managerPerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.MANAGER.id, permissionId: pid } },
      update: {},
      create: { roleId: roles.MANAGER.id, permissionId: pid },
    });
  }

  const storeManagerPerms = [
    "inventory.view", "inventory.manage",
    "production.view", "dispatch.view", "dispatch.create",
    "order.view", "report.view",
  ];
  for (const code of storeManagerPerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.STORE_MANAGER.id, permissionId: pid } },
      update: {},
      create: { roleId: roles.STORE_MANAGER.id, permissionId: pid },
    });
  }

  const accountantPerms = [
    "invoice.view", "invoice.create",
    "payment.view", "payment.manage",
    "payroll.view", "payroll.manage",
    "expense.view", "expense.manage",
    "report.view", "employee.view",
  ];
  for (const code of accountantPerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.ACCOUNTANT.id, permissionId: pid } },
      update: {},
      create: { roleId: roles.ACCOUNTANT.id, permissionId: pid },
    });
  }

  const distributorPerms = [
    "order.view", "order.create",
    "sales.view", "sales.create",
    "return.view", "return.create",
    "invoice.view", "payment.view",
  ];
  for (const code of distributorPerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.DISTRIBUTOR.id, permissionId: pid } },
      update: {},
      create: { roleId: roles.DISTRIBUTOR.id, permissionId: pid },
    });
  }

  const employeePerms = [
    "attendance.view", "attendance.create", "attendance.update",
  ];
  for (const code of employeePerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roles.EMPLOYEE.id, permissionId: pid } },
      update: {},
      create: { roleId: roles.EMPLOYEE.id, permissionId: pid },
    });
  }
  console.log("✅ Role-Permission mappings assigned");

  // ============================================================
  // 4. USERS
  // ============================================================
  const passwordHash = await bcrypt.hash("Password@123", 10);

  const usersData = [
    {
      username: "superadmin",
      email: "superadmin@aquanexus.com",
      firstName: "AquaNexus",
      lastName: "SuperAdmin",
      roleName: "SUPER_ADMIN",
    },
    {
      username: "admin",
      email: "admin@aquanexus.com",
      firstName: "Abhay",
      lastName: "Mahalle",
      roleName: "ADMIN",
    },
    {
      username: "manager",
      email: "manager@aquanexus.com",
      firstName: "Krishna",
      lastName: "Sharma",
      roleName: "MANAGER",
    },
    {
      username: "storemanager",
      email: "store@aquanexus.com",
      firstName: "Heramb",
      lastName: "Patil",
      roleName: "STORE_MANAGER",
    },
    {
      username: "accountant",
      email: "accountant@aquanexus.com",
      firstName: "Priya",
      lastName: "Desai",
      roleName: "ACCOUNTANT",
    },
    {
      username: "distributor1",
      email: "distributor@aquanexus.com",
      firstName: "Rahul",
      lastName: "Verma",
      roleName: "DISTRIBUTOR",
    },
    {
      username: "employee",
      email: "employee@aquanexus.com",
      firstName: "Aniket",
      lastName: "Sharma",
      roleName: "EMPLOYEE",
    },
  ];

  const users = {};
  for (const u of usersData) {
    const isSuper = u.roleName === "SUPER_ADMIN";
    if (isSuper) {
      const existingSuperAdmin = await prisma.user.findFirst({
        where: { isSuperAdmin: true },
      });
      if (existingSuperAdmin) {
        users.SUPER_ADMIN = existingSuperAdmin;
        continue;
      }
    }

    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        isSuperAdmin: isSuper,
        superAdminSlot: isSuper ? "SUPER_ADMIN" : null,
        organizationId: isSuper ? null : defaultOrg.id,
      },
      create: {
        username: u.username,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
        isSuperAdmin: isSuper,
        superAdminSlot: isSuper ? "SUPER_ADMIN" : null,
        organizationId: isSuper ? null : defaultOrg.id,
      },
    });
    users[u.roleName] = user;

    await prisma.userRole.upsert({
      where: {
        userId_roleId: { userId: user.id, roleId: roles[u.roleName].id },
      },
      update: {},
      create: { userId: user.id, roleId: roles[u.roleName].id },
    });
  }
  console.log(`✅ Users: ${usersData.map((u) => u.username).join(", ")}`);

  // ============================================================
  // 5. MANAGER ASSIGNMENTS
  // ============================================================
  const managerUser = users.MANAGER;
  if (managerUser) {
    for (const area of ["PRODUCTION", "STORE", "DISTRIBUTION"]) {
      await prisma.managerAssignment.upsert({
        where: { userId_area: { userId: managerUser.id, area } },
        update: {},
        create: { userId: managerUser.id, area },
      });
    }
  }

  if (users.STORE_MANAGER) {
    await prisma.managerAssignment.upsert({
      where: { userId_area: { userId: users.STORE_MANAGER.id, area: "STORE" } },
      update: {},
      create: { userId: users.STORE_MANAGER.id, area: "STORE" },
    });
  }
  console.log("✅ Manager assignments created");

  // ============================================================
  // 6. DEPARTMENTS
  // ============================================================
  const deptData = [
    { name: "Production", code: "PROD", description: "Production department" },
    { name: "Store", code: "STORE", description: "Store and inventory department" },
    { name: "Distribution", code: "DIST", description: "Distribution department" },
    { name: "Finance", code: "FIN", description: "Finance and accounting department" },
    { name: "HR", code: "HR", description: "Human resources department" },
    { name: "Administration", code: "ADMIN", description: "Administration department" },
  ];

  const departments = {};
  for (const d of deptData) {
    departments[d.code] = await prisma.department.upsert({
      where: {
        organizationId_code: { organizationId: defaultOrg.id, code: d.code },
      },
      update: {},
      create: { ...d, organizationId: defaultOrg.id },
    });
  }
  console.log(`✅ Departments: ${deptData.map((d) => d.name).join(", ")}`);

  // ============================================================
  // 7. EMPLOYEES
  // ============================================================
  const employeesData = [
    {
      employeeCode: "EMP001",
      firstName: "Ramesh",
      lastName: "Kumar",
      email: "ramesh@aquanexus.com",
      phone: "9876543210",
      departmentCode: "PROD",
      designation: "Production Supervisor",
      joiningDate: new Date("2024-01-15"),
      employmentType: "PERMANENT",
    },
    {
      employeeCode: "EMP002",
      firstName: "Suresh",
      lastName: "Patel",
      email: "suresh@aquanexus.com",
      phone: "9876543211",
      departmentCode: "PROD",
      designation: "Machine Operator",
      joiningDate: new Date("2024-03-01"),
      employmentType: "PERMANENT",
    },
    {
      employeeCode: "EMP003",
      firstName: "Amit",
      lastName: "Singh",
      email: "amit@aquanexus.com",
      phone: "9876543212",
      departmentCode: "STORE",
      designation: "Store Keeper",
      joiningDate: new Date("2024-02-10"),
      employmentType: "PERMANENT",
    },
    {
      employeeCode: "EMP004",
      firstName: "Deepa",
      lastName: "Joshi",
      email: "deepa@aquanexus.com",
      phone: "9876543213",
      departmentCode: "DIST",
      designation: "Delivery Coordinator",
      joiningDate: new Date("2024-04-01"),
      employmentType: "CONTRACT",
    },
    {
      employeeCode: "EMP005",
      firstName: "Vijay",
      lastName: "Rao",
      email: "vijay@aquanexus.com",
      phone: "9876543214",
      departmentCode: "FIN",
      designation: "Accountant",
      joiningDate: new Date("2024-05-15"),
      employmentType: "PERMANENT",
    },
  ];

  const employees = {};
  for (const e of employeesData) {
    employees[e.employeeCode] = await prisma.employee.upsert({
      where: {
        organizationId_employeeCode: {
          organizationId: defaultOrg.id,
          employeeCode: e.employeeCode,
        },
      },
      update: {},
      create: {
        organizationId: defaultOrg.id,
        employeeCode: e.employeeCode,
        firstName: e.firstName,
        lastName: e.lastName,
        email: e.email,
        phone: e.phone,
        departmentId: departments[e.departmentCode].id,
        designation: e.designation,
        joiningDate: e.joiningDate,
        employmentType: e.employmentType,
      },
    });
  }
  console.log(`✅ Employees: ${employeesData.length} created`);

  // ============================================================
  // 8. PRODUCTS
  // ============================================================
  const productsData = [
    {
      sku: "WB-20L",
      name: "20 Litre Water Bottle",
      description: "Standard 20 litre packaged drinking water bottle",
      category: "Bottled Water",
      unit: "Bottle",
      sellingPrice: 40.0,
      costPrice: 25.0,
      minimumStock: 100,
    },
    {
      sku: "WB-1L",
      name: "1 Litre Water Bottle",
      description: "1 litre packaged drinking water bottle",
      category: "Bottled Water",
      unit: "Bottle",
      sellingPrice: 20.0,
      costPrice: 10.0,
      minimumStock: 500,
    },
    {
      sku: "WP-500ML",
      name: "500ml Water Pouch",
      description: "500ml water pouch",
      category: "Water Pouch",
      unit: "Pouch",
      sellingPrice: 5.0,
      costPrice: 2.5,
      minimumStock: 1000,
    },
  ];

  const products = {};
  for (const p of productsData) {
    products[p.sku] = await prisma.product.upsert({
      where: {
        organizationId_sku: { organizationId: defaultOrg.id, sku: p.sku },
      },
      update: {},
      create: { ...p, organizationId: defaultOrg.id },
    });
  }
  console.log(`✅ Products: ${productsData.length} created`);

  // ============================================================
  // 9. INVENTORY (Central Store)
  // ============================================================
  for (const sku of Object.keys(products)) {
    await prisma.inventory.upsert({
      where: { productId: products[sku].id },
      update: { organizationId: defaultOrg.id },
      create: {
        organizationId: defaultOrg.id,
        productId: products[sku].id,
        quantity: 500,
        reservedQuantity: 0,
        reorderLevel: products[sku].minimumStock,
      },
    });
  }
  console.log("✅ Inventory initialized for all products");

  // ============================================================
  // 10. PRODUCTION
  // ============================================================
  const production1 = await prisma.production.upsert({
    where: {
      organizationId_productionNumber: {
        organizationId: defaultOrg.id,
        productionNumber: "PRD-2024-001",
      },
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      productionNumber: "PRD-2024-001",
      productId: products["WB-20L"].id,
      quantity: 200,
      productionDate: new Date("2024-06-01"),
      status: "COMPLETED",
      batchNumber: "BATCH-001",
      remarks: "First production batch",
      createdBy: users.MANAGER.id,
    },
  });

  await prisma.production.upsert({
    where: {
      organizationId_productionNumber: {
        organizationId: defaultOrg.id,
        productionNumber: "PRD-2024-002",
      },
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      productionNumber: "PRD-2024-002",
      productId: products["WB-1L"].id,
      quantity: 500,
      productionDate: new Date("2024-06-05"),
      status: "COMPLETED",
      batchNumber: "BATCH-002",
      createdBy: users.MANAGER.id,
    },
  });
  console.log("✅ Production records created");

  // ============================================================
  // 11. GOODS RECEIVED
  // ============================================================
  await prisma.goodsReceived.upsert({
    where: {
      organizationId_grnNumber: {
        organizationId: defaultOrg.id,
        grnNumber: "GRN-2024-001",
      },
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      grnNumber: "GRN-2024-001",
      productId: products["WB-20L"].id,
      productionId: production1.id,
      quantity: 200,
      receivedDate: new Date("2024-06-02"),
      receivedBy: users.STORE_MANAGER.id,
      remarks: "Full batch received",
    },
  });
  console.log("✅ Goods received records created");

  // ============================================================
  // 12. SALES AREAS
  // ============================================================
  const areasData = [
    { name: "North Zone", code: "NZ", description: "Northern sales region" },
    { name: "South Zone", code: "SZ", description: "Southern sales region" },
  ];

  const salesAreas = {};
  for (const a of areasData) {
    salesAreas[a.code] = await prisma.salesArea.upsert({
      where: {
        organizationId_code: { organizationId: defaultOrg.id, code: a.code },
      },
      update: {},
      create: { ...a, organizationId: defaultOrg.id },
    });
  }
  console.log("✅ Sales areas created");

  // ============================================================
  // 13. DISTRIBUTORS
  // ============================================================
  const distData = [
    {
      distributorCode: "DIST001",
      name: "AquaFlow Distributors",
      email: "aquaflow@example.com",
      phone: "9001234567",
      address: "123 Water Lane, Mumbai",
      salesAreaCode: "NZ",
      creditLimit: 50000.0,
    },
    {
      distributorCode: "DIST002",
      name: "HydroSupply Co.",
      email: "hydrosupply@example.com",
      phone: "9007654321",
      address: "456 River Road, Pune",
      salesAreaCode: "SZ",
      creditLimit: 75000.0,
    },
  ];

  const distributors = {};
  for (const d of distData) {
    distributors[d.distributorCode] = await prisma.distributor.upsert({
      where: {
        organizationId_distributorCode: {
          organizationId: defaultOrg.id,
          distributorCode: d.distributorCode,
        },
      },
      update: {},
      create: {
        organizationId: defaultOrg.id,
        distributorCode: d.distributorCode,
        name: d.name,
        email: d.email,
        phone: d.phone,
        address: d.address,
        salesAreaId: salesAreas[d.salesAreaCode].id,
        creditLimit: d.creditLimit,
      },
    });
  }
  console.log("✅ Distributors created");

  if (users.DISTRIBUTOR) {
    await prisma.userDistributor.upsert({
      where: {
        userId_distributorId: {
          userId: users.DISTRIBUTOR.id,
          distributorId: distributors["DIST001"].id,
        },
      },
      update: {},
      create: {
        userId: users.DISTRIBUTOR.id,
        distributorId: distributors["DIST001"].id,
      },
    });
  }

  // ============================================================
  // 14. SUPPLIERS
  // ============================================================
  await prisma.supplier.upsert({
    where: {
      organizationId_supplierCode: {
        organizationId: defaultOrg.id,
        supplierCode: "SUP001",
      },
    },
    update: {},
    create: {
      organizationId: defaultOrg.id,
      supplierCode: "SUP001",
      name: "PackageMart Pvt Ltd",
      email: "info@packagemart.com",
      phone: "9112233445",
      address: "789 Industrial Area, Delhi",
    },
  });
  console.log("✅ Suppliers created");

  console.log("\n🎉 AquaNexus database seeding completed successfully!");
  console.log("   SuperAdmin: superadmin@aquanexus.com / Password@123");
  console.log("   Admin: admin@aquanexus.com / Password@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
