export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  monthYear: string;
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  deductions: number;
  netSalary: number;
  paymentStatus: 'PAID' | 'PENDING' | 'PROCESSING';
  paymentDate?: string;
}

export interface AccountantPayment {
  id: string;
  paymentNumber: string;
  type: 'DISTRIBUTOR_COLLECTION' | 'SUPPLIER_PAYMENT' | 'SALARY_PAYMENT' | 'EXPENSE_PAYMENT';
  partyName: string;
  amount: number;
  date: string;
  paymentMethod: 'BANK_TRANSFER' | 'CHEQUE' | 'CASH' | 'ONLINE';
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  referenceNumber: string;
}

export interface ExpenseRecord {
  id: string;
  expenseNumber: string;
  category: 'UTILITIES' | 'MAINTENANCE' | 'LOGISTICS' | 'RAW_MATERIALS' | 'SALARIES' | 'OTHER';
  description: string;
  amount: number;
  date: string;
  approvedBy: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
}

export interface AccountantOutstanding {
  receivables: {
    total: number;
    distributorOutstanding: {
      id: string;
      distributorName: string;
      amount: number;
      dueDate: string;
    }[];
  };
  payables: {
    total: number;
    supplierOutstanding: {
      id: string;
      supplierName: string;
      amount: number;
      dueDate: string;
    }[];
  };
}

export interface AccountantDashboardData {
  totalPayrollThisMonth: number;
  totalCollectionsThisMonth: number;
  totalExpensesThisMonth: number;
  netOutstandingReceivables: number;
  netOutstandingPayables: number;
  recentExpenses: ExpenseRecord[];
  recentPayments: AccountantPayment[];
}
