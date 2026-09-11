import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  Receipt,
  AlertCircle,
  TrendingUp,
  PieChart,
  Plus,
  ArrowRight
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarChartWrapper } from '@/components/charts/BarChartWrapper';
import { DonutChartWrapper } from '@/components/charts/DonutChartWrapper';
import { apiClient } from '@/lib/api-client';
import { Expense, PayrollRecord, Payment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    async function loadFinanceData() {
      const [payrRes, expRes, payRes] = await Promise.all([
        apiClient.getPayroll(),
        apiClient.getExpenses(),
        apiClient.getPayments(),
      ]);
      if (payrRes.success) setPayroll(payrRes.data);
      if (expRes.success) setExpenses(expRes.data);
      if (payRes.success) setPayments(payRes.data);
    }
    loadFinanceData();
  }, []);

  const totalPayrollMonth = payroll.reduce((acc, p) => acc + p.netSalary, 0);
  const totalExpensesMonth = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalDistributorPaymentsReceived = payments
    .filter(p => p.paymentType === 'DISTRIBUTOR_PAYMENT')
    .reduce((acc, p) => acc + p.amount, 0);
  const totalOutstandingReceivables = 32275; // Derived distributor dues

  // Cash flow chart data
  const cashFlowData = [
    { month: 'Apr', collections: 180000, expenses: 110000 },
    { month: 'May', collections: 220000, expenses: 125000 },
    { month: 'Jun', collections: 210000, expenses: 130000 },
    { month: 'Jul', collections: 245000, expenses: 140000 },
    { month: 'Aug', collections: 260000, expenses: 135000 },
    { month: 'Sep', collections: 195000, expenses: 108100 },
  ];

  // Expense distribution chart
  const expenseDonutData = [
    { name: 'Power & Utilities', value: 64200, color: '#0F4C81' },
    { name: 'Raw Material Media', value: 28500, color: '#1597D4' },
    { name: 'Fleet Diesel', value: 15400, color: '#22B8CF' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Financial & Payroll Dashboard"
        description="Overview of plant cash flows, distributor collections, supplier payments, operational expenses, and employee payroll."
        breadcrumb={['AquaNexus', 'Accountant', 'Dashboard']}
        action={
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/accountant/expenses')} icon={Plus}>
              Record Expense
            </Button>
            <Button onClick={() => navigate('/accountant/reports')} variant="secondary" icon={PieChart}>
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
          subtitle="Payments received this period"
          icon={DollarSign}
          change="+12.4% vs last mo"
          changeType="positive"
        />
        <KPICard
          label="Monthly Payroll Dues"
          value={formatCurrency(totalPayrollMonth)}
          subtitle="4 Employees logged"
          icon={Users}
        />
        <KPICard
          label="Operational Expenses"
          value={formatCurrency(totalExpensesMonth)}
          subtitle="Utilities, raw material, fuel"
          icon={Receipt}
        />
        <KPICard
          label="Distributor Receivables"
          value={formatCurrency(totalOutstandingReceivables)}
          subtitle="Pending distributor dues"
          icon={AlertCircle}
          statusBadge={<Badge variant="warning">Action Needed</Badge>}
        />
      </div>

      {/* Financial Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cash Flow Collections vs Expenditures</CardTitle>
            <span className="text-xs text-textMuted">6 Months Overview</span>
          </CardHeader>
          <CardContent>
            <BarChartWrapper
              data={cashFlowData}
              xKey="month"
              bars={[
                { key: 'collections', name: 'Collections (₹)', color: '#0F4C81' },
                { key: 'expenses', name: 'Expenditures (₹)', color: '#1597D4' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        {/* Expense Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChartWrapper data={expenseDonutData} height={260} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Payments & Payroll Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payment Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payment Transactions</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accountant/payments')}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {payments.map(pay => (
              <div key={pay.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-textPrimary">{pay.payerName}</p>
                  <p className="text-[11px] text-textMuted mt-0.5">{pay.paymentNumber} • {pay.paymentMethod.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-success">+{formatCurrency(pay.amount)}</span>
                  <p className="text-[11px] text-textMuted">{formatDate(pay.paymentDate)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Employee Payroll Dues Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Payroll Summary</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/accountant/payroll')}>
              Manage Payroll
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {payroll.map(payr => (
              <div key={payr.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-textPrimary">{payr.employeeName}</p>
                  <p className="text-[11px] text-textMuted mt-0.5">{payr.department} • {payr.designation}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-textPrimary">{formatCurrency(payr.netSalary)}</span>
                  <div className="mt-0.5">
                    <Badge variant={payr.status === 'PAID' ? 'success' : 'warning'}>
                      {payr.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
