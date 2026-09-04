import { fetchApi, ApiResponse } from '@/lib/apiClient';
import {
  Product,
  Order,
  DistributorStock,
  SaleRecord,
  ReturnRecord,
  Invoice,
  Payment,
  OutstandingSummary,
  DistributorDashboardData,
} from '@/types/distributor';

const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'AquaPure 20L Jar',
    category: 'Packaged Water',
    unit: 'Jar',
    pricePerUnit: 80,
    availableStock: 1200,
    sku: 'AP-20L',
    status: 'AVAILABLE',
  },
  {
    id: 'prod-2',
    name: 'AquaPure 1L Bottle Box (12 Pcs)',
    category: 'Packaged Water',
    unit: 'Box',
    pricePerUnit: 180,
    availableStock: 450,
    sku: 'AP-1L-BOX',
    status: 'AVAILABLE',
  },
  {
    id: 'prod-3',
    name: 'AquaPure 500ml Bottle Box (24 Pcs)',
    category: 'Packaged Water',
    unit: 'Box',
    pricePerUnit: 220,
    availableStock: 40,
    sku: 'AP-500ML-BOX',
    status: 'LOW_STOCK',
  },
  {
    id: 'prod-4',
    name: 'AquaPure Dispenser Stand',
    category: 'Equipment',
    unit: 'Piece',
    pricePerUnit: 450,
    availableStock: 0,
    sku: 'AP-STAND-01',
    status: 'OUT_OF_STOCK',
  },
];

const mockOrders: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'ORD-2026-001',
    distributorId: 'dist-01',
    distributorName: 'AquaFlow Distribution Services',
    orderDate: '2026-09-01',
    totalAmount: 16000,
    status: 'DELIVERED',
    shippingAddress: 'Plot 45, Industrial Zone, Area North',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'AquaPure 20L Jar',
        quantity: 200,
        unitPrice: 80,
        totalPrice: 16000,
      },
    ],
  },
  {
    id: 'ord-102',
    orderNumber: 'ORD-2026-002',
    distributorId: 'dist-01',
    distributorName: 'AquaFlow Distribution Services',
    orderDate: '2026-09-02',
    totalAmount: 9000,
    status: 'DISPATCHED',
    shippingAddress: 'Plot 45, Industrial Zone, Area North',
    items: [
      {
        id: 'item-2',
        productId: 'prod-2',
        productName: 'AquaPure 1L Bottle Box (12 Pcs)',
        quantity: 50,
        unitPrice: 180,
        totalPrice: 9000,
      },
    ],
  },
  {
    id: 'ord-103',
    orderNumber: 'ORD-2026-003',
    distributorId: 'dist-01',
    distributorName: 'AquaFlow Distribution Services',
    orderDate: '2026-09-03',
    totalAmount: 4400,
    status: 'PENDING',
    shippingAddress: 'Plot 45, Industrial Zone, Area North',
    items: [
      {
        id: 'item-3',
        productId: 'prod-3',
        productName: 'AquaPure 500ml Bottle Box (24 Pcs)',
        quantity: 20,
        unitPrice: 220,
        totalPrice: 4400,
      },
    ],
  },
];

const mockStock: DistributorStock[] = [
  {
    id: 'stock-1',
    productId: 'prod-1',
    productName: 'AquaPure 20L Jar',
    sku: 'AP-20L',
    currentStock: 350,
    unit: 'Jar',
    lastUpdated: '2026-09-03',
    status: 'AVAILABLE',
  },
  {
    id: 'stock-2',
    productId: 'prod-2',
    productName: 'AquaPure 1L Bottle Box (12 Pcs)',
    sku: 'AP-1L-BOX',
    currentStock: 120,
    unit: 'Box',
    lastUpdated: '2026-09-02',
    status: 'AVAILABLE',
  },
  {
    id: 'stock-3',
    productId: 'prod-3',
    productName: 'AquaPure 500ml Bottle Box (24 Pcs)',
    sku: 'AP-500ML-BOX',
    currentStock: 15,
    unit: 'Box',
    lastUpdated: '2026-08-30',
    status: 'LOW_STOCK',
  },
];

const mockSales: SaleRecord[] = [
  {
    id: 'sale-1',
    saleNumber: 'SL-2026-089',
    orderId: 'ord-101',
    saleDate: '2026-09-01',
    customerArea: 'North Sector Retailers',
    itemsCount: 200,
    totalAmount: 16000,
    paymentStatus: 'PAID',
  },
  {
    id: 'sale-2',
    saleNumber: 'SL-2026-090',
    orderId: 'ord-102',
    saleDate: '2026-09-02',
    customerArea: 'Metro Hypermarket Chain',
    itemsCount: 50,
    totalAmount: 9000,
    paymentStatus: 'PENDING',
  },
];

const mockReturns: ReturnRecord[] = [
  {
    id: 'ret-1',
    returnNumber: 'RET-2026-004',
    orderId: 'ord-101',
    productName: 'AquaPure 20L Jar',
    quantity: 5,
    reason: 'Defective Seal',
    returnDate: '2026-09-02',
    status: 'APPROVED',
    refundAmount: 400,
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-551',
    orderId: 'ord-101',
    issueDate: '2026-09-01',
    dueDate: '2026-09-15',
    amount: 16000,
    paidAmount: 16000,
    status: 'PAID',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-552',
    orderId: 'ord-102',
    issueDate: '2026-09-02',
    dueDate: '2026-09-16',
    amount: 9000,
    paidAmount: 0,
    status: 'PENDING',
  },
];

const mockPayments: Payment[] = [
  {
    id: 'pay-1',
    paymentNumber: 'PAY-2026-101',
    invoiceId: 'inv-1',
    amount: 16000,
    paymentDate: '2026-09-02',
    paymentMethod: 'BANK_TRANSFER',
    referenceNumber: 'HDFC-TXN-998822',
    status: 'COMPLETED',
  },
];

export const distributorService = {
  async getDashboard(): Promise<ApiResponse<DistributorDashboardData>> {
    const res = await fetchApi<DistributorDashboardData>('/distributors/dashboard');
    if (res.success && res.data) return res;
    return {
      success: true,
      message: 'Distributor dashboard loaded',
      data: {
        authorizedArea: 'North Zone - Sector 4 & 5',
        distributorName: 'AquaFlow Distribution Services',
        totalProductsAvailable: 4,
        activeOrdersCount: 2,
        totalStockUnits: 485,
        totalSalesThisMonth: 25000,
        outstandingAmount: 9000,
        recentOrders: mockOrders,
      },
    };
  },

  async getProducts(): Promise<ApiResponse<Product[]>> {
    const res = await fetchApi<Product[]>('/products');
    if (res.success && res.data) return res;
    return { success: true, message: 'Products retrieved', data: mockProducts };
  },

  async getOrders(): Promise<ApiResponse<Order[]>> {
    const res = await fetchApi<Order[]>('/orders');
    if (res.success && res.data) return res;
    return { success: true, message: 'Orders retrieved', data: mockOrders };
  },

  async getOrderById(id: string): Promise<ApiResponse<Order | null>> {
    const res = await fetchApi<Order>(`/orders/${id}`);
    if (res.success && res.data) return res;
    const found = mockOrders.find((o) => o.id === id || o.orderNumber === id);
    return {
      success: true,
      message: found ? 'Order details retrieved' : 'Order not found',
      data: found || null,
    };
  },

  async createOrder(orderData: Partial<Order>): Promise<ApiResponse<Order>> {
    const res = await fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
    if (res.success && res.data) return res;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: `ORD-2026-0${mockOrders.length + 1}`,
      distributorId: 'dist-01',
      distributorName: 'AquaFlow Distribution Services',
      orderDate: new Date().toISOString().split('T')[0],
      totalAmount: orderData.totalAmount || 0,
      status: 'PENDING',
      shippingAddress: orderData.shippingAddress || 'Default North Zone Warehouse',
      items: orderData.items || [],
      notes: orderData.notes,
    };
    mockOrders.unshift(newOrder);
    return { success: true, message: 'Order placed successfully', data: newOrder };
  },

  async getStock(): Promise<ApiResponse<DistributorStock[]>> {
    const res = await fetchApi<DistributorStock[]>('/distributor-stock');
    if (res.success && res.data) return res;
    return { success: true, message: 'Stock data retrieved', data: mockStock };
  },

  async getSales(): Promise<ApiResponse<SaleRecord[]>> {
    const res = await fetchApi<SaleRecord[]>('/sales');
    if (res.success && res.data) return res;
    return { success: true, message: 'Sales data retrieved', data: mockSales };
  },

  async getReturns(): Promise<ApiResponse<ReturnRecord[]>> {
    const res = await fetchApi<ReturnRecord[]>('/returns');
    if (res.success && res.data) return res;
    return { success: true, message: 'Returns data retrieved', data: mockReturns };
  },

  async getInvoices(): Promise<ApiResponse<Invoice[]>> {
    const res = await fetchApi<Invoice[]>('/invoices');
    if (res.success && res.data) return res;
    return { success: true, message: 'Invoices retrieved', data: mockInvoices };
  },

  async getPayments(): Promise<ApiResponse<Payment[]>> {
    const res = await fetchApi<Payment[]>('/payments');
    if (res.success && res.data) return res;
    return { success: true, message: 'Payments retrieved', data: mockPayments };
  },

  async getOutstanding(): Promise<ApiResponse<OutstandingSummary>> {
    const res = await fetchApi<OutstandingSummary>('/outstanding');
    if (res.success && res.data) return res;
    return {
      success: true,
      message: 'Outstanding retrieved',
      data: {
        distributorId: 'dist-01',
        totalInvoiced: 25000,
        totalPaid: 16000,
        totalOutstanding: 9000,
        dueWithin30Days: 9000,
        overdue30To60Days: 0,
        overdue60PlusDays: 0,
      },
    };
  },
};
