export type UserRole = 'admin' | 'manager' | 'store_manager' | 'accountant' | 'distributor';

export type ManagerArea = 'PRODUCTION' | 'STORE' | 'DISTRIBUTION';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedAreas?: ManagerArea[];
  distributorId?: string;
  salesArea?: string;
}

export interface Product {
  id: string;
  productCode: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  availableStock: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  orderDate: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  deliveryAddress: string;
  notes?: string;
  invoiceId?: string;
}

export interface DistributorStock {
  id: string;
  distributorId: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  minThreshold: number;
  status: 'AVAILABLE' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  lastUpdated: string;
}

export interface Sale {
  id: string;
  saleNumber: string;
  orderId?: string;
  distributorId: string;
  distributorName: string;
  customerName: string;
  saleDate: string;
  totalAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

export interface ProductReturn {
  id: string;
  returnNumber: string;
  distributorId: string;
  distributorName: string;
  productId: string;
  productName: string;
  quantity: number;
  reason: 'DAMAGED' | 'EXPIRED' | 'EXCESS' | 'DEFECTIVE';
  returnDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  refundAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  distributorId: string;
  distributorName: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'ONLINE_UPI';

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId?: string;
  invoiceNumber?: string;
  referenceId: string;
  payerName: string;
  paymentType: 'DISTRIBUTOR_PAYMENT' | 'SUPPLIER_PAYMENT' | 'SALARY_PAYMENT';
  paymentMethod: PaymentMethod;
  paymentDate: string;
  amount: number;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'FAILED';
  notes?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  payPeriod: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  deductions: number;
  netSalary: number;
  status: 'PAID' | 'PENDING';
  paidDate?: string;
}

export type ExpenseCategory = 'RAW_MATERIAL' | 'UTILITIES' | 'FUEL_TRANSPORT' | 'MAINTENANCE' | 'OTHER';

export interface Expense {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expenseDate: string;
  createdBy: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface OutstandingSummary {
  totalDistributorOutstanding: number;
  totalSupplierOutstanding: number;
  overdueCount: number;
  distributorBalances: {
    id: string;
    distributorId: string;
    distributorName: string;
    salesArea: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueDays: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
