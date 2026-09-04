export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  pricePerUnit: number;
  availableStock: number;
  sku: string;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: string;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  orderDate: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string;
  notes?: string;
}

export interface DistributorStock {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  unit: string;
  lastUpdated: string;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface SaleRecord {
  id: string;
  saleNumber: string;
  orderId: string;
  saleDate: string;
  customerArea: string;
  itemsCount: number;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  orderId: string;
  productName: string;
  quantity: number;
  reason: string;
  returnDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  refundAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'ONLINE';
  referenceNumber: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface OutstandingSummary {
  distributorId: string;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  dueWithin30Days: number;
  overdue30To60Days: number;
  overdue60PlusDays: number;
}

export interface DistributorDashboardData {
  authorizedArea: string;
  distributorName: string;
  totalProductsAvailable: number;
  activeOrdersCount: number;
  totalStockUnits: number;
  totalSalesThisMonth: number;
  outstandingAmount: number;
  recentOrders: Order[];
}
