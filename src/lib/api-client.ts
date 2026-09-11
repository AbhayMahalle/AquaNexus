import {
  ApiResponse,
  Product,
  Order,
  OrderItem,
  DistributorStock,
  Sale,
  ProductReturn,
  Invoice,
  Payment,
  PayrollRecord,
  Expense,
  OutstandingSummary
} from './types';

// Mock Initial Data for Phase 1 Frontend Development & Testing
const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', productCode: 'PRD-20L-CAN', name: '20 Litre Mineral Water Can', category: 'Cans', unit: 'Can', unitPrice: 45, availableStock: 3500, status: 'AVAILABLE' },
  { id: 'p2', productCode: 'PRD-1L-BOT', name: '1 Litre Mineral Water Bottle Pack (12 Pcs)', category: 'Bottles', unit: 'Pack', unitPrice: 180, availableStock: 1200, status: 'AVAILABLE' },
  { id: 'p3', productCode: 'PRD-500ML-BOT', name: '500 ml Water Bottle Pack (24 Pcs)', category: 'Bottles', unit: 'Pack', unitPrice: 220, availableStock: 450, status: 'LOW_STOCK' },
  { id: 'p4', productCode: 'PRD-250ML-CUP', name: '250 ml Water Cup Box (48 Pcs)', category: 'Cups', unit: 'Box', unitPrice: 150, availableStock: 0, status: 'OUT_OF_STOCK' },
];

let MOCK_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-0089',
    distributorId: 'dist-01',
    distributorName: 'AquaFlow Distribution (North Zone)',
    orderDate: '2026-09-02',
    status: 'DELIVERED',
    items: [
      { id: 'item-1', productId: 'p1', productName: '20 Litre Mineral Water Can', unit: 'Can', quantity: 200, unitPrice: 45, totalPrice: 9000 },
      { id: 'item-2', productId: 'p2', productName: '1 Litre Mineral Water Bottle Pack (12 Pcs)', unit: 'Pack', quantity: 50, unitPrice: 180, totalPrice: 9000 },
    ],
    subtotal: 18000,
    taxAmount: 900,
    totalAmount: 18900,
    deliveryAddress: 'Sector 12, Industrial Hub, North Region',
    notes: 'Urgent morning delivery requested',
    invoiceId: 'inv-501',
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-0094',
    distributorId: 'dist-01',
    distributorName: 'AquaFlow Distribution (North Zone)',
    orderDate: '2026-09-03',
    status: 'DISPATCHED',
    items: [
      { id: 'item-3', productId: 'p1', productName: '20 Litre Mineral Water Can', unit: 'Can', quantity: 300, unitPrice: 45, totalPrice: 13500 },
    ],
    subtotal: 13500,
    taxAmount: 675,
    totalAmount: 14175,
    deliveryAddress: 'Main Market Complex, North Region',
    invoiceId: 'inv-502',
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-2026-0102',
    distributorId: 'dist-01',
    distributorName: 'AquaFlow Distribution (North Zone)',
    orderDate: '2026-09-04',
    status: 'PENDING',
    items: [
      { id: 'item-4', productId: 'p2', productName: '1 Litre Mineral Water Bottle Pack (12 Pcs)', unit: 'Pack', quantity: 100, unitPrice: 180, totalPrice: 18000 },
      { id: 'item-5', productId: 'p3', productName: '500 ml Water Bottle Pack (24 Pcs)', unit: 'Pack', quantity: 40, unitPrice: 220, totalPrice: 8800 },
    ],
    subtotal: 26800,
    taxAmount: 1340,
    totalAmount: 28140,
    deliveryAddress: 'Central Warehouse, North Region',
    notes: 'Please verify seal quality before dispatch',
  },
];

let MOCK_DISTRIBUTOR_STOCK: DistributorStock[] = [
  { id: 'ds-1', distributorId: 'dist-01', productId: 'p1', productName: '20 Litre Mineral Water Can', unit: 'Can', quantity: 180, minThreshold: 50, status: 'AVAILABLE', lastUpdated: '2026-09-03' },
  { id: 'ds-2', distributorId: 'dist-01', productId: 'p2', productName: '1 Litre Mineral Water Bottle Pack (12 Pcs)', unit: 'Pack', quantity: 35, minThreshold: 40, status: 'LOW_STOCK', lastUpdated: '2026-09-02' },
  { id: 'ds-3', distributorId: 'dist-01', productId: 'p3', productName: '500 ml Water Bottle Pack (24 Pcs)', unit: 'Pack', quantity: 12, minThreshold: 20, status: 'LOW_STOCK', lastUpdated: '2026-09-01' },
];

let MOCK_SALES: Sale[] = [
  { id: 'sal-1', saleNumber: 'SAL-2026-042', orderId: 'ord-101', distributorId: 'dist-01', distributorName: 'AquaFlow Distribution', customerName: 'Apex Mart Supermarket', saleDate: '2026-09-02', totalAmount: 12500, paymentStatus: 'PAID' },
  { id: 'sal-2', saleNumber: 'SAL-2026-043', orderId: 'ord-101', distributorId: 'dist-01', distributorName: 'AquaFlow Distribution', customerName: 'City Hospital Canteen', saleDate: '2026-09-03', totalAmount: 6400, paymentStatus: 'PARTIAL' },
];

let MOCK_RETURNS: ProductReturn[] = [
  { id: 'ret-1', returnNumber: 'RET-2026-008', distributorId: 'dist-01', distributorName: 'AquaFlow Distribution', productId: 'p1', productName: '20 Litre Mineral Water Can', quantity: 8, reason: 'DAMAGED', returnDate: '2026-09-01', status: 'APPROVED', refundAmount: 360 },
  { id: 'ret-2', returnNumber: 'RET-2026-012', distributorId: 'dist-01', distributorName: 'AquaFlow Distribution', productId: 'p3', productName: '500 ml Water Bottle Pack (24 Pcs)', quantity: 3, reason: 'EXPIRED', returnDate: '2026-09-03', status: 'PENDING', refundAmount: 660 },
];

let MOCK_INVOICES: Invoice[] = [
  { id: 'inv-501', invoiceNumber: 'INV-2026-0301', orderId: 'ord-101', orderNumber: 'ORD-2026-0089', distributorId: 'dist-01', distributorName: 'AquaFlow Distribution', issueDate: '2026-09-02', dueDate: '2026-09-17', subtotal: 18000, taxAmount: 900, totalAmount: 18900, paidAmount: 18900, outstandingAmount: 0, status: 'PAID' },
  { id: 'inv-502', invoiceNumber: 'INV-2026-0308', orderId: 'ord-102', orderNumber: 'ORD-2026-0094', distributorId: 'dist-01', distributorName: 'AquaFlow Distribution', issueDate: '2026-09-03', dueDate: '2026-09-18', subtotal: 13500, taxAmount: 675, totalAmount: 14175, paidAmount: 5000, outstandingAmount: 9175, status: 'PARTIAL' },
  { id: 'inv-500', invoiceNumber: 'INV-2026-0275', orderId: 'ord-090', orderNumber: 'ORD-2026-0060', distributorId: 'dist-01', distributorName: 'AquaFlow Distribution', issueDate: '2026-08-15', dueDate: '2026-08-30', subtotal: 22000, taxAmount: 1100, totalAmount: 23100, paidAmount: 0, outstandingAmount: 23100, status: 'OVERDUE' },
];

let MOCK_PAYMENTS: Payment[] = [
  { id: 'pay-1', paymentNumber: 'PAY-2026-0155', invoiceId: 'inv-501', invoiceNumber: 'INV-2026-0301', referenceId: 'UPI-994820194820', payerName: 'AquaFlow Distribution', paymentType: 'DISTRIBUTOR_PAYMENT', paymentMethod: 'ONLINE_UPI', paymentDate: '2026-09-02', amount: 18900, status: 'PAID', notes: 'Full order settlement' },
  { id: 'pay-2', paymentNumber: 'PAY-2026-0162', invoiceId: 'inv-502', invoiceNumber: 'INV-2026-0308', referenceId: 'NEFT-883920194', payerName: 'AquaFlow Distribution', paymentType: 'DISTRIBUTOR_PAYMENT', paymentMethod: 'BANK_TRANSFER', paymentDate: '2026-09-03', amount: 5000, status: 'PARTIAL', notes: 'Part payment against dispatch' },
  { id: 'pay-3', paymentNumber: 'PAY-2026-0140', invoiceId: 'inv-sup-10', referenceId: 'CHQ-402910', payerName: 'PurePoly Packaging Suppliers', paymentType: 'SUPPLIER_PAYMENT', paymentMethod: 'CHEQUE', paymentDate: '2026-09-01', amount: 45000, status: 'PAID', notes: 'Raw material PET preforms' },
];

let MOCK_PAYROLL: PayrollRecord[] = [
  { id: 'payr-1', employeeId: 'EMP-001', employeeName: 'Ramesh Kumar', department: 'Production', designation: 'Plant Technician', payPeriod: 'August 2026', baseSalary: 28000, overtimeHours: 14, overtimePay: 3500, deductions: 1200, netSalary: 30300, status: 'PAID', paidDate: '2026-09-01' },
  { id: 'payr-2', employeeId: 'EMP-002', employeeName: 'Suresh Patil', department: 'Store', designation: 'Inventory Operator', payPeriod: 'August 2026', baseSalary: 24000, overtimeHours: 8, overtimePay: 1800, deductions: 1000, netSalary: 24800, status: 'PAID', paidDate: '2026-09-01' },
  { id: 'payr-3', employeeId: 'EMP-003', employeeName: 'Sunita Sharma', department: 'Quality Assurance', designation: 'Lab Analyst', payPeriod: 'August 2026', baseSalary: 32000, overtimeHours: 0, overtimePay: 0, deductions: 1500, netSalary: 30500, status: 'PENDING' },
  { id: 'payr-4', employeeId: 'EMP-004', employeeName: 'Amit Verma', department: 'Maintenance', designation: 'Senior Mechanic', payPeriod: 'August 2026', baseSalary: 35000, overtimeHours: 12, overtimePay: 4200, deductions: 1800, netSalary: 37400, status: 'PENDING' },
];

let MOCK_EXPENSES: Expense[] = [
  { id: 'exp-1', expenseNumber: 'EXP-2026-088', category: 'UTILITIES', description: 'State Electricity Board Monthly Power Bill', amount: 64200, expenseDate: '2026-09-02', createdBy: 'Plant Accountant', status: 'APPROVED' },
  { id: 'exp-2', expenseNumber: 'EXP-2026-089', category: 'RAW_MATERIAL', description: 'Water Treatment Purification Chemical Media', amount: 28500, expenseDate: '2026-09-03', createdBy: 'Plant Accountant', status: 'APPROVED' },
  { id: 'exp-3', expenseNumber: 'EXP-2026-090', category: 'FUEL_TRANSPORT', description: 'Delivery Fleet Diesel Refueling', amount: 15400, expenseDate: '2026-09-04', createdBy: 'Store Manager', status: 'PENDING' },
];

// Service functions supporting live backend API or fallback mock data
export const apiClient = {
  // Products
  async getProducts(): Promise<ApiResponse<Product[]>> {
    return { success: true, data: MOCK_PRODUCTS, message: 'Products retrieved successfully' };
  },

  // Orders
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return { success: true, data: MOCK_ORDERS, message: 'Orders retrieved successfully' };
  },

  async getOrderById(id: string): Promise<ApiResponse<Order | null>> {
    const order = MOCK_ORDERS.find(o => o.id === id || o.orderNumber === id) || null;
    return { success: !!order, data: order, message: order ? 'Order details retrieved' : 'Order not found' };
  },

  async createOrder(newOrder: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'status' | 'subtotal' | 'taxAmount' | 'totalAmount' | 'items'> & { items: { productId: string; quantity: number }[] }): Promise<ApiResponse<Order>> {
    const orderItems: OrderItem[] = newOrder.items.map((item, idx) => {
      const p = MOCK_PRODUCTS.find(prod => prod.id === item.productId)!;
      return {
        id: `item-${Date.now()}-${idx}`,
        productId: p.id,
        productName: p.name,
        unit: p.unit,
        quantity: item.quantity,
        unitPrice: p.unitPrice,
        totalPrice: p.unitPrice * item.quantity,
      };
    });

    const subtotal = orderItems.reduce((acc, i) => acc + i.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.05);
    const totalAmount = subtotal + taxAmount;

    const created: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      distributorId: 'dist-01',
      distributorName: 'AquaFlow Distribution (North Zone)',
      orderDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      items: orderItems,
      subtotal,
      taxAmount,
      totalAmount,
      deliveryAddress: newOrder.deliveryAddress,
      notes: newOrder.notes,
    };

    MOCK_ORDERS.unshift(created);
    return { success: true, data: created, message: 'Order created successfully' };
  },

  // Distributor Stock
  async getDistributorStock(): Promise<ApiResponse<DistributorStock[]>> {
    return { success: true, data: MOCK_DISTRIBUTOR_STOCK, message: 'Distributor stock retrieved' };
  },

  // Sales
  async getSales(): Promise<ApiResponse<Sale[]>> {
    return { success: true, data: MOCK_SALES, message: 'Sales log retrieved' };
  },

  // Returns
  async getReturns(): Promise<ApiResponse<ProductReturn[]>> {
    return { success: true, data: MOCK_RETURNS, message: 'Returns log retrieved' };
  },

  async createReturn(newReturn: Omit<ProductReturn, 'id' | 'returnNumber' | 'returnDate' | 'status' | 'refundAmount'>): Promise<ApiResponse<ProductReturn>> {
    const prod = MOCK_PRODUCTS.find(p => p.id === newReturn.productId)!;
    const created: ProductReturn = {
      ...newReturn,
      id: `ret-${Date.now()}`,
      returnNumber: `RET-2026-${Math.floor(100 + Math.random() * 900)}`,
      returnDate: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      refundAmount: prod ? prod.unitPrice * newReturn.quantity : 0,
    };
    MOCK_RETURNS.unshift(created);
    return { success: true, data: created, message: 'Return request submitted' };
  },

  // Invoices
  async getInvoices(): Promise<ApiResponse<Invoice[]>> {
    return { success: true, data: MOCK_INVOICES, message: 'Invoices retrieved' };
  },

  // Payments
  async getPayments(): Promise<ApiResponse<Payment[]>> {
    return { success: true, data: MOCK_PAYMENTS, message: 'Payments retrieved' };
  },

  async recordPayment(paymentData: Omit<Payment, 'id' | 'paymentNumber' | 'paymentDate' | 'status'>): Promise<ApiResponse<Payment>> {
    const created: Payment = {
      ...paymentData,
      id: `pay-${Date.now()}`,
      paymentNumber: `PAY-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      status: 'PAID',
    };
    MOCK_PAYMENTS.unshift(created);

    // Update invoice if linked
    if (created.invoiceId) {
      const inv = MOCK_INVOICES.find(i => i.id === created.invoiceId || i.invoiceNumber === created.invoiceId);
      if (inv) {
        inv.paidAmount += created.amount;
        inv.outstandingAmount = Math.max(0, inv.totalAmount - inv.paidAmount);
        inv.status = inv.outstandingAmount === 0 ? 'PAID' : 'PARTIAL';
      }
    }

    return { success: true, data: created, message: 'Payment recorded successfully' };
  },

  // Payroll
  async getPayroll(): Promise<ApiResponse<PayrollRecord[]>> {
    return { success: true, data: MOCK_PAYROLL, message: 'Payroll records retrieved' };
  },

  // Expenses
  async getExpenses(): Promise<ApiResponse<Expense[]>> {
    return { success: true, data: MOCK_EXPENSES, message: 'Expenses retrieved' };
  },

  async addExpense(expenseData: Omit<Expense, 'id' | 'expenseNumber' | 'expenseDate' | 'status'>): Promise<ApiResponse<Expense>> {
    const created: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      expenseNumber: `EXP-2026-${Math.floor(100 + Math.random() * 900)}`,
      expenseDate: new Date().toISOString().split('T')[0],
      status: 'APPROVED',
    };
    MOCK_EXPENSES.unshift(created);
    return { success: true, data: created, message: 'Expense added successfully' };
  },

  // Outstanding Summary
  async getOutstandingSummary(): Promise<ApiResponse<OutstandingSummary>> {
    const totalDistributorOutstanding = MOCK_INVOICES.reduce((acc, i) => acc + i.outstandingAmount, 0);
    const totalSupplierOutstanding = 42500; // Supplier dues balance

    return {
      success: true,
      data: {
        totalDistributorOutstanding,
        totalSupplierOutstanding,
        overdueCount: MOCK_INVOICES.filter(i => i.status === 'OVERDUE').length,
        distributorBalances: [
          {
            id: 'db-01',
            distributorId: 'dist-01',
            distributorName: 'AquaFlow Distribution (North Zone)',
            salesArea: 'North Region',
            invoiceCount: MOCK_INVOICES.length,
            totalAmount: MOCK_INVOICES.reduce((a, i) => a + i.totalAmount, 0),
            paidAmount: MOCK_INVOICES.reduce((a, i) => a + i.paidAmount, 0),
            outstandingAmount: totalDistributorOutstanding,
            overdueDays: 15,
          },
          {
            id: 'db-02',
            distributorId: 'dist-02',
            distributorName: 'BlueDrop Enterprises (East Zone)',
            salesArea: 'East Region',
            invoiceCount: 2,
            totalAmount: 45000,
            paidAmount: 30000,
            outstandingAmount: 15000,
            overdueDays: 0,
          },
        ],
      },
      message: 'Outstanding financial data retrieved',
    };
  },
};
