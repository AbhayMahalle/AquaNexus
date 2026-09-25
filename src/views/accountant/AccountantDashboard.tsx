'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  Receipt,
  AlertCircle,
  TrendingUp,
  PieChart,
  Plus,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarChartWrapper } from '@/components/charts/BarChartWrapper';
import { DonutChartWrapper } from '@/components/charts/DonutChartWrapper';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { apiClient } from '@/lib/api-client';
import { Expense, PayrollRecord, Payment, Invoice } from '@/types/business';
import { formatCurrency, formatDate } from '@/lib/utils';
import { NotificationsPanel } from '@/components/layout/NotificationsPanel';

// AquaNexus Brand Color Palette
const THEME_PALETTE = ['#F97316', '#1F2937', '#EA580C', '#4B5563', '#FB923C', '#374151', '#F59E0B'];

export const AccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadFinanceData = async () => {
    setIsLoading(true);
    try {
      const [payrRes, expRes, payRes, invRes] = await Promise.all([
        apiClient.getPayroll(),
        apiClient.getExpenses(),
        apiClient.getPayments(),
        apiClient.getInvoices(),
      ]);

      if (payrRes.success) setPayroll(payrRes.data);
      if (expRes.success) setExpenses(expRes.data);
      if (payRes.success) setPayments(payRes.data);
      if (invRes.success) setInvoices(invRes.data);
    } catch (err) {
      console.error('Failed to load financial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  // Aggregated live KPIs
  const totalPayrollMonth = useMemo(() => payroll.reduce((acc, p) => acc + p.netSalary, 0), [payroll]);
  const pendingPayrollCount = useMemo(() => payroll.filter((p) => p.status !== 'PAID').length, [payroll]);
  const totalExpensesMonth = useMemo(() => expenses.reduce((acc, e) => acc + e.amount, 0), [expenses]);
  const totalDistributorPaymentsReceived = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const totalOutstandingReceivables = useMemo(
    () => invoices.reduce((acc, i) => acc + (i.outstandingAmount || 0), 0),
    [invoices]
  );

  // Dynamic Cash Flow data by month from live payments & expenses
  const cashFlowData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      months.push({
        month: monthNames[mIdx],
        monthIndex: mIdx,
        collections: 0,
        expenses: 0,
      });
    }

    for (const p of payments) {
      if (p.paymentDate) {
        const d = new Date(p.paymentDate);
        const m = d.getMonth();
        const found = months.find((item) => item.monthIndex === m);
        if (found) found.collections += p.amount;
      }
    }

    for (const e of expenses) {
      if (e.expenseDate) {
        const d = new Date(e.expenseDate);
        const m = d.getMonth();
        const found = months.find((item) => item.monthIndex === m);
        if (found) found.expenses += e.amount;
      }
    }

    return months.map(({ month, collections, expenses: expVal }) => ({
      month,
      collections: Math.round(collections),
      expenses: Math.round(expVal),
    }));
  }, [payments, expenses]);

  // Dynamic Expense category distribution from live expenses
  const expenseDonutData = useMemo(() => {
    if (expenses.length === 0) {
      return [{ name: 'No Expenses Logged', value: 1, color: '#9CA3AF' }];
    }

    const categoryTotals: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category || 'OTHER';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
    }

    return Object.entries(categoryTotals).map(([cat, val], idx) => ({
      name: cat.replace(/_/g, ' '),
      value: Math.round(val),
      color: THEME_PALETTE[idx % THEME_PALETTE.length],
    }));
  }, [expenses]);

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'accountant']}>
      <div className="space-y-6">
      <PageHeader
        title="Plant Financial & Payroll Dashboard"
        description="Live overview of plant cash flows, distributor collections, supplier payments, operational expenses, and employee payroll."
        breadcrumb={['AquaNexus', 'Accountant', 'Dashboard']}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={loadFinanceData} isLoading={isLoading} icon={RefreshCw}>
              Refresh
            </Button>
            <Button onClick={() => navigate(-1)} icon={Plus}>
              Record Expense
            </Button>
            <Button onClick={() => navigate(-1)} variant="secondary" icon={PieChart}>
              Financial Reports
            </Button>
          </div>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Distributor Collections"
          value={formatCurrency(totalDistributorPaymentsReceived)}
          subtitle={`${payments.length} collections recorded`}
          icon={DollarSign}
        />
        <KPICard
          label="Monthly Payroll Dues"
          value={formatCurrency(totalPayrollMonth)}
          subtitle={`${payroll.length} Employees (${pendingPayrollCount} pending)`}
          icon={Users}
        />
        <KPICard
          label="Operational Expenses"
          value={formatCurrency(totalExpensesMonth)}
          subtitle={`${expenses.length} expenditure entries`}
          icon={Receipt}
        />
        <KPICard
          label="Distributor Receivables"
          value={formatCurrency(totalOutstandingReceivables)}
          subtitle={`Across ${invoices.length} billing invoices`}
          icon={AlertCircle}
          statusBadge={
            totalOutstandingReceivables > 0 ? (
              <Badge variant="warning">Action Needed</Badge>
            ) : (
              <Badge variant="success">All Settled</Badge>
            )
          }
        />
      </div>

      {/* Financial Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trends */}
        <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-xs">
          <CardHeader className="border-b border-gray-100 pb-3 mb-3">
            <div>
              <CardTitle>Cash Flow: Collections vs Expenditures</CardTitle>
              <p className="text-xs text-textSecondary mt-0.5">Monthly inflows (Collections) compared with outflows (Expenditures)</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-textSecondary">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                Collections
              </span>
              <span className="flex items-center gap-1.5 font-medium text-textSecondary">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-800 inline-block"></span>
                Expenditures
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <BarChartWrapper
              data={cashFlowData}
              xKey="month"
              bars={[
                { key: 'collections', name: 'Collections (₹)', color: '#F97316' },
                { key: 'expenses', name: 'Expenditures (₹)', color: '#1F2937' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        {/* Expense Category Breakdown */}
        <Card className="bg-white border border-gray-200 shadow-xs">
          <CardHeader className="border-b border-gray-100 pb-3 mb-3">
            <div>
              <CardTitle>Expense Distribution</CardTitle>
              <p className="text-xs text-textSecondary mt-0.5">Proportional breakdown by operational category</p>
            </div>
          </CardHeader>
          <CardContent>
            <DonutChartWrapper data={expenseDonutData} height={260} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments & Payroll Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payment Transactions */}
        <Card className="bg-white border border-gray-200 shadow-xs">
          <CardHeader className="border-b border-gray-100 pb-3 mb-2 flex items-center justify-between">
            <CardTitle>Recent Payment Collections</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="bg-white text-black border-gray-300 hover:bg-gray-100 text-xs"
            >
              View All ({payments.length})
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <p className="py-6 text-center text-xs text-textSecondary">No payments recorded yet.</p>
            ) : (
              payments.slice(0, 5).map((pay) => (
                <div key={pay.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-textPrimary">{pay.payerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-1.5 py-0.2 rounded">
                        {pay.paymentNumber}
                      </span>
                      <span className="text-[11px] text-textMuted">• {pay.paymentMethod.replace(/_/g, ' ')}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-600">+{formatCurrency(pay.amount)}</span>
                    <p className="text-[11px] text-textMuted mt-0.5">{formatDate(pay.paymentDate)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Employee Payroll Dues Preview */}
        <Card className="bg-white border border-gray-200 shadow-xs">
          <CardHeader className="border-b border-gray-100 pb-3 mb-2 flex items-center justify-between">
            <CardTitle>Employee Payroll Summary</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="bg-white text-black border-gray-300 hover:bg-gray-100 text-xs"
            >
              Manage Payroll ({payroll.length})
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-gray-100">
            {payroll.length === 0 ? (
              <p className="py-6 text-center text-xs text-textSecondary">No payroll records generated yet.</p>
            ) : (
              payroll.slice(0, 5).map((payr) => (
                <div key={payr.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-textPrimary">{payr.employeeName}</p>
                    <p className="text-[11px] text-textMuted mt-0.5">
                      {payr.department} • {payr.designation}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-textPrimary">{formatCurrency(payr.netSalary)}</span>
                    <div className="mt-1">
                      <Badge variant={payr.status === 'PAID' ? 'success' : 'warning'}>
                        {payr.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <NotificationsPanel maxItems={4} />
      </div>
    </AuthGuard>
  );
};

export default AccountantDashboard;
