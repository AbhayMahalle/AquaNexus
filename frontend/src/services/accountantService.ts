import { fetchApi, ApiResponse } from '@/lib/apiClient';
import {
  PayrollRecord,
  AccountantPayment,
  ExpenseRecord,
  AccountantOutstanding,
  AccountantDashboardData,
} from '@/types/accountant';

const mockPayroll: PayrollRecord[] = [
  {
    id: 'pay-001',
    employeeId: 'EMP-101',
    employeeName: 'Rahul Sharma',
    department: 'Production',
    designation: 'Plant Operator',
    monthYear: 'August 2026',
    baseSalary: 28000,
    overtimeHours: 12,
    overtimePay: 2400,
    deductions: 1500,
    netSalary: 28900,
    paymentStatus: 'PAID',
    paymentDate: '2026-09-01',
  },
  {
    id: 'pay-002',
    employeeId: 'EMP-102',
    employeeName: 'Priya Verma',
    department: 'Quality Assurance',
    designation: 'Lab Technician',
    monthYear: 'August 2026',
    baseSalary: 32000,
    overtimeHours: 6,
    overtimePay: 1200,
    deductions: 1800,
    netSalary: 31400,
    paymentStatus: 'PAID',
    paymentDate: '2026-09-01',
  },
  {
    id: 'pay-003',
    employeeId: 'EMP-103',
    employeeName: 'Suresh Patil',
    department: 'Store & Logistics',
    designation: 'Inventory Loader',
    monthYear: 'August 2026',
    baseSalary: 22000,
    overtimeHours: 15,
    overtimePay: 2250,
    deductions: 1000,
    netSalary: 23250,
    paymentStatus: 'PENDING',
  },
];

const mockAccountantPayments: AccountantPayment[] = [
  {
    id: 'acc-pay-1',
    paymentNumber: 'PMT-2026-001',
    type: 'DISTRIBUTOR_COLLECTION',
    partyName: 'AquaFlow Distribution Services',
    amount: 16000,
    date: '2026-09-02',
    paymentMethod: 'BANK_TRANSFER',
    status: 'COMPLETED',
    referenceNumber: 'TXN-HDFC-998822',
  },
  {
    id: 'acc-pay-2',
    paymentNumber: 'PMT-2026-002',
    type: 'SUPPLIER_PAYMENT',
    partyName: 'Polymer Pack Ltd (Jar Supplier)',
    amount: 45000,
    date: '2026-09-01',
    paymentMethod: 'CHEQUE',
    status: 'COMPLETED',
    referenceNumber: 'CHQ-554411',
  },
  {
    id: 'acc-pay-3',
    paymentNumber: 'PMT-2026-003',
    type: 'SALARY_PAYMENT',
    partyName: 'August 2026 Staff Payroll (Part 1)',
    amount: 60300,
    date: '2026-09-01',
    paymentMethod: 'BANK_TRANSFER',
    status: 'COMPLETED',
    referenceNumber: 'SAL-BATCH-0826',
  },
];

const mockExpenses: ExpenseRecord[] = [
  {
    id: 'exp-1',
    expenseNumber: 'EXP-2026-041',
    category: 'UTILITIES',
    description: 'Electricity Bill - Water Treatment Plant 1',
    amount: 38500,
    date: '2026-09-01',
    approvedBy: 'Plant Manager',
    status: 'APPROVED',
  },
  {
    id: 'exp-2',
    expenseNumber: 'EXP-2026-042',
    category: 'MAINTENANCE',
    description: 'RO Membrane Cleaning & Filter Replacement',
    amount: 14200,
    date: '2026-09-02',
    approvedBy: 'Plant Manager',
    status: 'APPROVED',
  },
  {
    id: 'exp-3',
    expenseNumber: 'EXP-2026-043',
    category: 'LOGISTICS',
    description: 'Delivery Fleet Diesel Refill',
    amount: 18600,
    date: '2026-09-03',
    approvedBy: 'Store Manager',
    status: 'PENDING',
  },
];

const mockOutstanding: AccountantOutstanding = {
  receivables: {
    total: 34000,
    distributorOutstanding: [
      {
        id: 'dist-01',
        distributorName: 'AquaFlow Distribution Services',
        amount: 9000,
        dueDate: '2026-09-16',
      },
      {
        id: 'dist-02',
        distributorName: 'BlueDrop Springs Agencies',
        amount: 25000,
        dueDate: '2026-09-20',
      },
    ],
  },
  payables: {
    total: 52000,
    supplierOutstanding: [
      {
        id: 'sup-01',
        supplierName: 'Polymer Pack Ltd',
        amount: 32000,
        dueDate: '2026-09-25',
      },
      {
        id: 'sup-02',
        supplierName: 'PureFilter Chemicals Inc',
        amount: 20000,
        dueDate: '2026-09-28',
      },
    ],
  },
};

export const accountantService = {
  async getDashboard(): Promise<ApiResponse<AccountantDashboardData>> {
    const res = await fetchApi<AccountantDashboardData>('/accountant/dashboard');
    if (res.success && res.data) return res;
    return {
      success: true,
      message: 'Accountant dashboard retrieved',
      data: {
        totalPayrollThisMonth: 83550,
        totalCollectionsThisMonth: 16000,
        totalExpensesThisMonth: 71300,
        netOutstandingReceivables: 34000,
        netOutstandingPayables: 52000,
        recentExpenses: mockExpenses,
        recentPayments: mockAccountantPayments,
      },
    };
  },

  async getPayroll(): Promise<ApiResponse<PayrollRecord[]>> {
    const res = await fetchApi<PayrollRecord[]>('/payroll');
    if (res.success && res.data) return res;
    return { success: true, message: 'Payroll retrieved', data: mockPayroll };
  },

  async getPayments(): Promise<ApiResponse<AccountantPayment[]>> {
    const res = await fetchApi<AccountantPayment[]>('/accountant/payments');
    if (res.success && res.data) return res;
    return { success: true, message: 'Payments retrieved', data: mockAccountantPayments };
  },

  async getExpenses(): Promise<ApiResponse<ExpenseRecord[]>> {
    const res = await fetchApi<ExpenseRecord[]>('/expenses');
    if (res.success && res.data) return res;
    return { success: true, message: 'Expenses retrieved', data: mockExpenses };
  },

  async createExpense(expense: Partial<ExpenseRecord>): Promise<ApiResponse<ExpenseRecord>> {
    const res = await fetchApi<ExpenseRecord>('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
    if (res.success && res.data) return res;

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      expenseNumber: `EXP-2026-0${mockExpenses.length + 40}`,
      category: expense.category || 'OTHER',
      description: expense.description || 'Unspecified Expense',
      amount: expense.amount || 0,
      date: new Date().toISOString().split('T')[0],
      approvedBy: 'Accountant',
      status: 'PENDING',
    };
    mockExpenses.unshift(newExpense);
    return { success: true, message: 'Expense logged successfully', data: newExpense };
  },

  async getOutstanding(): Promise<ApiResponse<AccountantOutstanding>> {
    const res = await fetchApi<AccountantOutstanding>('/accountant/outstanding');
    if (res.success && res.data) return res;
    return { success: true, message: 'Outstanding balances retrieved', data: mockOutstanding };
  },
};
