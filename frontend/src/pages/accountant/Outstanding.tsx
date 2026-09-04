import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { accountantService } from '@/services/accountantService';
import { AccountantOutstanding as AccountantOutstandingData } from '@/types/accountant';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AccountantOutstanding: React.FC = () => {
  const [outstanding, setOutstanding] = useState<AccountantOutstandingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOutstanding = async () => {
    setLoading(true);
    setError(null);
    const res = await accountantService.getOutstanding();
    if (res.success && res.data) {
      setOutstanding(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOutstanding();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Plant Outstanding Receivables & Payables" />
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  if (error || !outstanding) {
    return (
      <DashboardLayout>
        <PageHeader title="Plant Outstanding Receivables & Payables" />
        <ErrorState message={error || 'Failed to load outstanding data'} onRetry={loadOutstanding} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Plant Outstanding Balances Ledger"
        description="Dual audit of distributor pending receivables (money owed to plant) and supplier payables (money plant owes)."
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card hoverEffect className="border-l-4 border-l-[#16A34A]">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Distributor Receivables</span>
            <TrendingUp className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-3xl font-bold text-[#16A34A]">{formatCurrency(outstanding.receivables.total)}</div>
          <p className="text-xs text-[#64748B] mt-1">Pending payments from authorized distributors</p>
        </Card>

        <Card hoverEffect className="border-l-4 border-l-[#DC2626]">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Supplier Payables</span>
            <TrendingDown className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="text-3xl font-bold text-[#DC2626]">{formatCurrency(outstanding.payables.total)}</div>
          <p className="text-xs text-[#64748B] mt-1">Pending invoices payable to raw material vendors</p>
        </Card>
      </div>

      {/* Tables Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receivables Table */}
        <Card>
          <h3 className="font-semibold text-base text-[#172033] mb-4 pb-2 border-b border-[#E2E8F0]">
            Distributor Pending Receivables
          </h3>
          <Table<{ id: string; distributorName: string; amount: number; dueDate: string }>
            data={outstanding.receivables.distributorOutstanding}
            keyExtractor={(item) => item.id}
            columns={[
              { header: 'Distributor', accessorKey: 'distributorName', className: 'font-medium text-[#172033]' },
              { header: 'Due Date', cell: (row) => formatDate(row.dueDate) },
              { header: 'Amount Due', cell: (row) => <span className="font-bold text-sm text-[#0F4C81]">{formatCurrency(row.amount)}</span> },
            ]}
          />
        </Card>

        {/* Payables Table */}
        <Card>
          <h3 className="font-semibold text-base text-[#172033] mb-4 pb-2 border-b border-[#E2E8F0]">
            Supplier Outstanding Payables
          </h3>
          <Table<{ id: string; supplierName: string; amount: number; dueDate: string }>
            data={outstanding.payables.supplierOutstanding}
            keyExtractor={(item) => item.id}
            columns={[
              { header: 'Supplier Vendor', accessorKey: 'supplierName', className: 'font-medium text-[#172033]' },
              { header: 'Due Date', cell: (row) => formatDate(row.dueDate) },
              { header: 'Amount Payable', cell: (row) => <span className="font-bold text-sm text-[#DC2626]">{formatCurrency(row.amount)}</span> },
            ]}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
};
