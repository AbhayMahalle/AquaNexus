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
  // 1. ROLES
  // ============================================================
  const roleData = [
    { name: "ADMIN", description: "Full system access" },
    { name: "MANAGER", description: "Operational management" },
    { name: "STORE_MANAGER", description: "Store and inventory management" },
    { name: "ACCOUNTANT", description: "Finance and accounting" },
    { name: "DISTRIBUTOR", description: "Distributor portal access" },
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
  // Admin gets all permissions
  const allPermIds = Object.values(permissions).map((p) => p.id);
  for (const pid of allPermIds) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: roles.ADMIN.id, permissionId: pid },
      },
      update: {},
      create: { roleId: roles.ADMIN.id, permissionId: pid },
    });
  }

  // Manager gets operational permissions
  const managerPerms = [
    "employee.view",
    "employee.create",
    "employee.update",
    "attendance.view",
    "attendance.create",
    "attendance.update",
    "production.view",
    "production.create",
    "production.update",
    "inventory.view",
    "inventory.manage",
    "order.view",
    "order.create",
    "order.update",
    "dispatch.view",
    "dispatch.create",
    "report.view",
  ];
  for (const code of managerPerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: roles.MANAGER.id, permissionId: pid },
      },
      update: {},
      create: { roleId: roles.MANAGER.id, permissionId: pid },
    });
  }

  // Store Manager gets store-related permissions
  const storeManagerPerms = [
    "inventory.view",
    "inventory.manage",
    "production.view",
    "dispatch.view",
    "dispatch.create",
    "order.view",
    "report.view",
  ];
  for (const code of storeManagerPerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles.STORE_MANAGER.id,
          permissionId: pid,
        },
      },
      update: {},
      create: { roleId: roles.STORE_MANAGER.id, permissionId: pid },
    });
  }

  // Accountant gets finance permissions
  const accountantPerms = [
    "invoice.view",
    "invoice.create",
    "payment.view",
    "payment.manage",
    "payroll.view",
    "payroll.manage",
    "expense.view",
    "expense.manage",
    "report.view",
  ];
  for (const code of accountantPerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles.ACCOUNTANT.id,
          permissionId: pid,
        },
      },
      update: {},
      create: { roleId: roles.ACCOUNTANT.id, permissionId: pid },
    });
  }

  // Distributor gets distributor-facing permissions
  const distributorPerms = [
    "order.view",
    "order.create",
    "sales.view",
    "sales.create",
    "return.view",
    "return.create",
    "invoice.view",
    "payment.view",
  ];
  for (const code of distributorPerms) {
    const pid = permissions[code].id;
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: roles.DISTRIBUTOR.id,
          permissionId: pid,
        },
      },
      update: {},
      create: { roleId: roles.DISTRIBUTOR.id, permissionId: pid },
    });
  }
  console.log("✅ Role-Permission mappings assigned");

  // ============================================================
  // 4. USERS
  // ============================================================
  const passwordHash = await bcrypt.hash("Password@123", 10);

  const usersData = [
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
  ];

  const users = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        username: u.username,
        email: u.email,
        passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });
    users[u.roleName] = user;

    // Assign role
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
  const managerAreas = ["PRODUCTION", "STORE", "DISTRIBUTION"];
  for (const area of managerAreas) {
    await prisma.managerAssignment.upsert({
      where: {
        userId_area: { userId: managerUser.id, area },
      },
      update: {},
      create: { userId: managerUser.id, area },
    });
  }

  // Store manager gets STORE area assignment
  await prisma.managerAssignment.upsert({
    where: {
      userId_area: { userId: users.STORE_MANAGER.id, area: "STORE" },
    },
    update: {},
    create: { userId: users.STORE_MANAGER.id, area: "STORE" },
  });
  console.log("✅ Manager assignments created");

  // ============================================================
  // 6. DEPARTMENTS
  // ============================================================
  const deptData = [
    { name: "Production", code: "PROD", description: "Production department" },
    {
      name: "Store",
      code: "STORE",
      description: "Store and inventory department",
    },
    {
      name: "Distribution",
      code: "DIST",
      description: "Distribution department",
    },
    {
      name: "Finance",
      code: "FIN",
      description: "Finance and accounting department",
    },
    { name: "HR", code: "HR", description: "Human resources department" },
    {
      name: "Administration",
      code: "ADMIN",
      description: "Administration department",
    },
  ];

  const departments = {};
  for (const d of deptData) {
    departments[d.code] = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
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
      where: { employeeCode: e.employeeCode },
      update: {},
      create: {
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
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }
  console.log(`✅ Products: ${productsData.length} created`);

  // ============================================================
  // 9. INVENTORY (Central Store)
  // ============================================================
  for (const sku of Object.keys(products)) {
    await prisma.inventory.upsert({
      where: { productId: products[sku].id },
      update: {},
      create: {
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
    where: { productionNumber: "PRD-2024-001" },
    update: {},
    create: {
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

  const production2 = await prisma.production.upsert({
    where: { productionNumber: "PRD-2024-002" },
    update: {},
    create: {
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
  // GRN for production 1
  await prisma.goodsReceived.upsert({
    where: { grnNumber: "GRN-2024-001" },
    update: {},
    create: {
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
  // 12. STOCK TRANSACTIONS
  // ============================================================
  await prisma.stockTransaction.create({
    data: {
      productId: products["WB-20L"].id,
      transactionType: "PRODUCTION_RECEIPT",
      quantity: 200,
      referenceType: "GoodsReceived",
      remarks: "GRN-2024-001 receipt",
      createdBy: users.STORE_MANAGER.id,
    },
  });
  console.log("✅ Stock transactions created");

  // ============================================================
  // 13. SALES AREAS
  // ============================================================
  const areasData = [
    { name: "North Zone", code: "NZ", description: "Northern sales region" },
    { name: "South Zone", code: "SZ", description: "Southern sales region" },
  ];

  const salesAreas = {};
  for (const a of areasData) {
    salesAreas[a.code] = await prisma.salesArea.upsert({
      where: { code: a.code },
      update: {},
      create: a,
    });
  }
  console.log("✅ Sales areas created");

  // ============================================================
  // 14. DISTRIBUTORS
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
      where: { distributorCode: d.distributorCode },
      update: {},
      create: {
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

  // Link distributor user to first distributor
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
  console.log("✅ User-Distributor link created");

  // ============================================================
  // 15. DISTRIBUTOR STOCK
  // ============================================================
  for (const sku of Object.keys(products)) {
    await prisma.distributorStock.upsert({
      where: {
        distributorId_productId: {
          distributorId: distributors["DIST001"].id,
          productId: products[sku].id,
        },
      },
      update: {},
      create: {
        distributorId: distributors["DIST001"].id,
        productId: products[sku].id,
        quantity: 50,
      },
    });
  }
  console.log("✅ Distributor stock initialized");

  // ============================================================
  // 16. ORDERS
  // ============================================================
  const order1 = await prisma.order.upsert({
    where: { orderNumber: "ORD-2024-001" },
    update: {},
    create: {
      orderNumber: "ORD-2024-001",
      distributorId: distributors["DIST001"].id,
      orderDate: new Date("2024-06-10"),
      status: "DELIVERED",
      subtotal: 4000.0,
      discount: 200.0,
      tax: 684.0,
      totalAmount: 4484.0,
      notes: "First order",
      createdBy: users.DISTRIBUTOR.id,
    },
  });

  // Order items
  await prisma.orderItem.upsert({
    where: {
      orderId_productId: {
        orderId: order1.id,
        productId: products["WB-20L"].id,
      },
    },
    update: {},
    create: {
      orderId: order1.id,
      productId: products["WB-20L"].id,
      quantity: 100,
      unitPrice: 40.0,
      discount: 200.0,
      tax: 684.0,
      total: 4484.0,
    },
  });
  console.log("✅ Orders and order items created");

  // ============================================================
  // 17. DISPATCHES
  // ============================================================
  const dispatch1 = await prisma.dispatch.upsert({
    where: { dispatchNumber: "DSP-2024-001" },
    update: {},
    create: {
      dispatchNumber: "DSP-2024-001",
      orderId: order1.id,
      distributorId: distributors["DIST001"].id,
      dispatchDate: new Date("2024-06-11"),
      status: "DELIVERED",
      createdBy: users.STORE_MANAGER.id,
      remarks: "Dispatched via truck",
    },
  });

  await prisma.dispatchItem.upsert({
    where: {
      dispatchId_productId: {
        dispatchId: dispatch1.id,
        productId: products["WB-20L"].id,
      },
    },
    update: {},
    create: {
      dispatchId: dispatch1.id,
      productId: products["WB-20L"].id,
      quantity: 100,
    },
  });
  console.log("✅ Dispatches and dispatch items created");

  // ============================================================
  // 18. SALES
  // ============================================================
  const sale1 = await prisma.sale.upsert({
    where: { saleNumber: "SAL-2024-001" },
    update: {},
    create: {
      saleNumber: "SAL-2024-001",
      distributorId: distributors["DIST001"].id,
      saleDate: new Date("2024-06-15"),
      customerReference: "CUST-101",
      subtotal: 2000.0,
      discount: 100.0,
      tax: 342.0,
      totalAmount: 2242.0,
      status: "COMPLETED",
      createdBy: users.DISTRIBUTOR.id,
    },
  });

  await prisma.saleItem.upsert({
    where: {
      saleId_productId: {
        saleId: sale1.id,
        productId: products["WB-20L"].id,
      },
    },
    update: {},
    create: {
      saleId: sale1.id,
      productId: products["WB-20L"].id,
      quantity: 50,
      unitPrice: 40.0,
      discount: 100.0,
      tax: 342.0,
      total: 2242.0,
    },
  });
  console.log("✅ Sales and sale items created");

  // ============================================================
  // 19. RETURNS
  // ============================================================
  const return1 = await prisma.return.upsert({
    where: { returnNumber: "RET-2024-001" },
    update: {},
    create: {
      returnNumber: "RET-2024-001",
      distributorId: distributors["DIST001"].id,
      saleId: sale1.id,
      returnDate: new Date("2024-06-20"),
      reason: "Damaged in transit",
      status: "RECEIVED",
      createdBy: users.DISTRIBUTOR.id,
    },
  });

  await prisma.returnItem.upsert({
    where: {
      returnId_productId: {
        returnId: return1.id,
        productId: products["WB-20L"].id,
      },
    },
    update: {},
    create: {
      returnId: return1.id,
      productId: products["WB-20L"].id,
      quantity: 5,
      condition: "DAMAGED",
      remarks: "Bottles cracked during transit",
    },
  });
  console.log("✅ Returns and return items created");

  // ============================================================
  // 20. SUPPLIERS
  // ============================================================
  const supplier1 = await prisma.supplier.upsert({
    where: { supplierCode: "SUP001" },
    update: {},
    create: {
      supplierCode: "SUP001",
      name: "PackageMart Pvt Ltd",
      email: "info@packagemart.com",
      phone: "9112233445",
      address: "789 Industrial Area, Delhi",
    },
  });
  console.log("✅ Suppliers created");

  // ============================================================
  // 21. INVOICES
  // ============================================================
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: "INV-2024-001" },
    update: {},
    create: {
      invoiceNumber: "INV-2024-001",
      distributorId: distributors["DIST001"].id,
      orderId: order1.id,
      invoiceDate: new Date("2024-06-12"),
      dueDate: new Date("2024-07-12"),
      subtotal: 4000.0,
      discount: 200.0,
      tax: 684.0,
      totalAmount: 4484.0,
      status: "PARTIALLY_PAID",
    },
  });
  console.log("✅ Invoices created");

  // ============================================================
  // 22. PAYMENTS
  // ============================================================
  await prisma.payment.upsert({
    where: { paymentNumber: "PAY-2024-001" },
    update: {},
    create: {
      paymentNumber: "PAY-2024-001",
      invoiceId: invoice1.id,
      amount: 2000.0,
      paymentDate: new Date("2024-06-20"),
      paymentMethod: "BANK_TRANSFER",
      referenceNumber: "TXN-987654",
      status: "COMPLETED",
      remarks: "Partial payment",
      createdBy: users.ACCOUNTANT.id,
    },
  });
  console.log("✅ Payments created");

  // ============================================================
  // 23. EXPENSES
  // ============================================================
  await prisma.expense.upsert({
    where: { expenseNumber: "EXP-2024-001" },
    update: {},
    create: {
      expenseNumber: "EXP-2024-001",
      category: "Packaging Materials",
      amount: 15000.0,
      expenseDate: new Date("2024-06-05"),
      description: "Monthly packaging material purchase",
      supplierId: supplier1.id,
      status: "PAID",
      createdBy: users.ACCOUNTANT.id,
      approvedBy: users.ADMIN.id,
      approvedAt: new Date("2024-06-04"),
    },
  });
  console.log("✅ Expenses created");

  // ============================================================
  // 24. PAYROLL
  // ============================================================
  const payrollData = {
    employeeId: employees["EMP001"].id,
    payPeriodStart: new Date("2024-06-01"),
    payPeriodEnd: new Date("2024-06-30"),
    basicSalary: 25000.0,
    overtimeAmount: 3000.0,
    deductions: 2000.0,
    netSalary: 26000.0, // 25000 + 3000 - 2000
    status: "PAID",
    processedBy: users.ACCOUNTANT.id,
    processedAt: new Date("2024-07-05"),
  };
  const existingPayroll = await prisma.payroll.findFirst({
    where: {
      employeeId: payrollData.employeeId,
      payPeriodStart: payrollData.payPeriodStart,
      payPeriodEnd: payrollData.payPeriodEnd,
    },
  });
  if (existingPayroll) {
    await prisma.payroll.update({
      where: { id: existingPayroll.id },
      data: payrollData,
    });
  } else {
    await prisma.payroll.create({ data: payrollData });
  }
  console.log("✅ Payroll records created");

  // ============================================================
  // 25. ATTENDANCE (sample)
  // ============================================================
  await prisma.attendance.upsert({
    where: {
      employeeId_attendanceDate: {
        employeeId: employees["EMP001"].id,
        attendanceDate: new Date("2024-06-03"),
      },
    },
    update: {},
    create: {
      employeeId: employees["EMP001"].id,
      attendanceDate: new Date("2024-06-03"),
      status: "PRESENT",
      checkIn: new Date("2024-06-03T09:00:00Z"),
      checkOut: new Date("2024-06-03T18:00:00Z"),
    },
  });
  console.log("✅ Attendance records created");

  // ============================================================
  // 26. NOTIFICATIONS (sample)
  // ============================================================
  await prisma.notification.create({
    data: {
      userId: users.ADMIN.id,
      title: "System Initialized",
      message: "AquaNexus database has been seeded successfully.",
      type: "SUCCESS",
    },
  });
  console.log("✅ Notifications created");

  // ============================================================
  // 27. AUDIT LOG (sample)
  // ============================================================
  await prisma.auditLog.create({
    data: {
      userId: users.ADMIN.id,
      action: "SEED",
      entityType: "SYSTEM",
      entityId: "database",
      newValues: { event: "Database seeded" },
      ipAddress: "127.0.0.1",
    },
  });
  console.log("✅ Audit log records created");

  console.log("\n🎉 AquaNexus database seeding completed successfully!");
  console.log("   Default login: admin@aquanexus.com / Password@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
