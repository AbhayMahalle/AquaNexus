import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { accountantService } from '@/services/accountantService';
import { AccountantDashboardData, ExpenseRecord, AccountantPayment } from '@/types/accountant';
import { formatCurrency } from '@/lib/utils';

export const AccountantDashboard: React.FC = () => {
  const [data, setData] = useState<AccountantDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    const res = await accountantService.getDashboard();
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Accountant Dashboard" description="Plant financial oversight & payroll overview." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <PageHeader title="Accountant Dashboard" />
        <ErrorState message={error || 'Failed to load accountant dashboard'} onRetry={loadDashboard} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Accountant Dashboard"
        description="Centralized plant financial monitoring, payroll dispatches, expenses, and outstanding balance audit."
        action={
          <div className="flex items-center gap-3">
            <Link to="/accountant/expenses">
              <Button icon={<Plus className="w-4 h-4" />}>Record Expense</Button>
            </Link>
            <Link to="/accountant/payroll">
              <Button variant="secondary" icon={<Users className="w-4 h-4" />}>Process Payroll</Button>
            </Link>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card hoverEffect>
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Payroll This Month</span>
            <Users className="w-4 h-4 text-[#0F4C81]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{formatCurrency(data.totalPayrollThisMonth)}</div>
          <p className="text-xs text-[#64748B] mt-1">Staff salaries & overtime</p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Collections</span>
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-bold text-[#16A34A]">{formatCurrency(data.totalCollectionsThisMonth)}</div>
          <p className="text-xs text-[#64748B] mt-1">Distributor invoice payments</p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Expenses Logged</span>
            <TrendingDown className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{formatCurrency(data.totalExpensesThisMonth)}</div>
          <p className="text-xs text-[#64748B] mt-1">Utilities, raw materials, fleet</p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Receivables</span>
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#0F4C81]">{formatCurrency(data.netOutstandingReceivables)}</div>
          <p className="text-xs text-[#64748B] mt-1">Distributor pending balance</p>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="font-semibold text-base text-[#172033]">Recent Expenses</h3>
              <p className="text-xs text-[#64748B]">Operational plant cost disbursements</p>
            </div>
            <Link to="/accountant/expenses">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>

          <Table<ExpenseRecord>
            data={data.recentExpenses}
            keyExtractor={(item) => item.id}
            columns={[
              { header: 'Expense Ref', accessorKey: 'expenseNumber', className: 'font-semibold text-[#0F4C81]' },
              { header: 'Category', accessorKey: 'category', className: 'text-xs font-medium text-[#64748B]' },
              { header: 'Amount', cell: (row) => formatCurrency(row.amount) },
              { header: 'Status', cell: (row) => <Badge status={row.status} /> },
            ]}
          />
        </Card>

        {/* Recent Financial Payments */}
        <Card>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
            <div>
              <h3 className="font-semibold text-base text-[#172033]">Recent Payments Log</h3>
              <p className="text-xs text-[#64748B]">Collections, supplier payments & salary dispatches</p>
            </div>
            <Link to="/accountant/payments">
              <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
                View All
              </Button>
            </Link>
          </div>

          <Table<AccountantPayment>
            data={data.recentPayments}
            keyExtractor={(item) => item.id}
            columns={[
              { header: 'Payment Ref', accessorKey: 'paymentNumber', className: 'font-semibold text-[#0F4C81]' },
              { header: 'Party / Note', accessorKey: 'partyName', className: 'font-medium text-[#172033]' },
              { header: 'Amount', cell: (row) => formatCurrency(row.amount) },
              { header: 'Status', cell: (row) => <Badge status={row.status} /> },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};
