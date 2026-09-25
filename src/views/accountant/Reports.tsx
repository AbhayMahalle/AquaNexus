'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, Wallet, Receipt, PieChart } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BarChartWrapper } from '@/components/charts/BarChartWrapper';
import { DonutChartWrapper } from '@/components/charts/DonutChartWrapper';
import { apiClient } from '@/lib/api-client';
import { Payment, Expense, PayrollRecord } from '@/types/business';
import { formatCurrency } from '@/lib/utils';

// AquaNexus Brand Color Palette
const THEME_PALETTE = ['#F97316', '#1F2937', '#EA580C', '#4B5563', '#FB923C', '#374151', '#F59E0B'];

export const AccountantReports: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [payRes, expRes, payrRes] = await Promise.all([
        apiClient.getPayments(),
        apiClient.getExpenses(),
        apiClient.getPayroll(),
      ]);

      if (payRes.success) setPayments(payRes.data);
      if (expRes.success) setExpenses(expRes.data);
      if (payrRes.success) setPayroll(payrRes.data);
    } catch (err) {
      console.error('Failed to load financial reports data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  // Real P&L calculations
  const totalCollections = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const totalExpenses = useMemo(() => expenses.reduce((acc, e) => acc + e.amount, 0), [expenses]);
  const totalPayroll = useMemo(() => payroll.reduce((acc, p) => acc + p.netSalary, 0), [payroll]);
  const netSurplus = totalCollections - totalExpenses - totalPayroll;
  const operatingMargin = totalCollections > 0 ? ((netSurplus / totalCollections) * 100).toFixed(1) : '0';

  // Expenditure breakdown from live expenses
  const expenseBreakdown = useMemo(() => {
    if (expenses.length === 0) {
      return [{ name: 'No Expenses Recorded', value: 1, color: '#9CA3AF' }];
    }

    const categories: Record<string, number> = {};
    for (const e of expenses) {
      const cat = e.category || 'OTHER';
      categories[cat] = (categories[cat] || 0) + e.amount;
    }

    return Object.entries(categories).map(([key, val], idx) => ({
      name: key.replace(/_/g, ' '),
      value: Math.round(val),
      color: THEME_PALETTE[idx % THEME_PALETTE.length],
    }));
  }, [expenses]);

  // Quarterly / Monthly trend from live data
  const trendComparison = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const months = [];
    for (let i = 4; i >= 0; i--) {
      const mIdx = (currentMonth - i + 12) % 12;
      months.push({
        label: monthNames[mIdx],
        mIdx,
        revenue: 0,
        costs: 0,
      });
    }

    for (const p of payments) {
      if (p.paymentDate) {
        const m = new Date(p.paymentDate).getMonth();
        const found = months.find((item) => item.mIdx === m);
        if (found) found.revenue += p.amount;
      }
    }

    for (const e of expenses) {
      if (e.expenseDate) {
        const m = new Date(e.expenseDate).getMonth();
        const found = months.find((item) => item.mIdx === m);
        if (found) found.costs += e.amount;
      }
    }

    return months.map((m) => ({
      period: m.label,
      revenue: Math.round(m.revenue),
      surplus: Math.round(m.revenue - m.costs),
    }));
  }, [payments, expenses]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Financial & Accounting Reports"
        description="Authoritative financial statements, operating surplus ledger, and expenditure distribution audits."
        breadcrumb={['AquaNexus', 'Accountant', 'Reports']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadReportData} isLoading={isLoading} icon={RefreshCw}>
              Refresh
            </Button>
            <Button onClick={() => window.print()} icon={Download}>
              Print / Export Report (PDF)
            </Button>
          </div>
        }
      />

      {/* KPI Performance Summary (Using Unified KPICards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Gross Inflow Revenue"
          value={formatCurrency(totalCollections)}
          subtitle={`${payments.length} settled collections`}
          icon={DollarSign}
        />
        <KPICard
          label="Operational Outflows"
          value={formatCurrency(totalExpenses)}
          subtitle={`${expenses.length} expenditure entries`}
          icon={Receipt}
        />
        <KPICard
          label="Payroll Disbursements"
          value={formatCurrency(totalPayroll)}
          subtitle={`${payroll.length} staff records`}
          icon={Wallet}
        />
        <KPICard
          label="Net Operating Surplus"
          value={formatCurrency(netSurplus)}
          subtitle={`Operating Margin: ${operatingMargin}%`}
          icon={TrendingUp}
          statusBadge={
            netSurplus >= 0 ? (
              <Badge variant="success">Profitable Surplus</Badge>
            ) : (
              <Badge variant="danger">Operating Deficit</Badge>
            )
          }
        />
      </div>

      {/* Profit & Loss Overview */}
      <Card className="bg-white border border-gray-200 shadow-xs">
        <CardHeader className="border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
          <div>
            <CardTitle>Operating Profit &amp; Loss Statement</CardTitle>
            <p className="text-xs text-textSecondary mt-0.5">Summary of actual revenues collected versus expenditures incurred</p>
          </div>
          <Badge variant={netSurplus >= 0 ? 'success' : 'danger'}>
            {netSurplus >= 0 ? 'Surplus Positive' : 'Deficit'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="divide-y divide-gray-100 text-sm">
            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-textPrimary">Gross Distributor Collections (Revenue)</p>
                <p className="text-xs text-textMuted">Inflow from plant bottled water distribution sales</p>
              </div>
              <span className="font-extrabold text-emerald-600 text-base">+{formatCurrency(totalCollections)}</span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-textPrimary">Plant Operational Expenditures</p>
                <p className="text-xs text-textMuted">Utilities (electricity, water), raw material media, fleet fuel &amp; maintenance</p>
              </div>
              <span className="font-bold text-danger text-base">-{formatCurrency(totalExpenses)}</span>
            </div>

            <div className="py-3 flex justify-between items-center">
              <div>
                <p className="font-semibold text-textPrimary">Employee Compensation &amp; Overtime</p>
                <p className="text-xs text-textMuted">Monthly salaries and plant operator overtime disbursements</p>
              </div>
              <span className="font-bold text-danger text-base">-{formatCurrency(totalPayroll)}</span>
            </div>
          </div>

          {/* Prominent Net Surplus Banner */}
          <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-4">
            <div>
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Net Plant Operating Surplus / (Deficit)</p>
              <p className="text-xs text-orange-950 font-medium mt-0.5">
                Effective operating margin after all operational obligations: <span className="font-bold">{operatingMargin}%</span>
              </p>
            </div>
            <div className="text-right">
              <span className={`text-2xl font-black ${netSurplus >= 0 ? 'text-orange-600' : 'text-danger'}`}>
                {netSurplus >= 0 ? '+' : ''}{formatCurrency(netSurplus)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border border-gray-200 shadow-xs">
          <CardHeader className="border-b border-gray-100 pb-3 mb-3">
            <div>
              <CardTitle>Monthly Revenue vs Operating Surplus</CardTitle>
              <p className="text-xs text-textSecondary mt-0.5">Gross collections compared with operating surplus by period</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-textSecondary">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                Revenue
              </span>
              <span className="flex items-center gap-1.5 font-medium text-textSecondary">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-800 inline-block"></span>
                Surplus
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <BarChartWrapper
              data={trendComparison}
              xKey="period"
              bars={[
                { key: 'revenue', name: 'Gross Revenue (₹)', color: '#F97316' },
                { key: 'surplus', name: 'Net Surplus (₹)', color: '#1F2937' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-200 shadow-xs">
          <CardHeader className="border-b border-gray-100 pb-3 mb-3">
            <div>
              <CardTitle>Expenditure Distribution by Category</CardTitle>
              <p className="text-xs text-textSecondary mt-0.5">Operational cost allocation across major expense headers</p>
            </div>
          </CardHeader>
          <CardContent>
            <DonutChartWrapper data={expenseBreakdown} height={260} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountantReports;
