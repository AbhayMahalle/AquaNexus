import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { OutstandingSummary } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export const AccountantOutstanding: React.FC = () => {
  const [summary, setSummary] = useState<OutstandingSummary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      const res = await apiClient.getOutstandingSummary();
      if (res.success) setSummary(res.data);
    }
    loadSummary();
  }, []);

  if (!summary) {
    return <div className="p-8 text-center text-textSecondary">Loading financial data...</div>;
  }

  const columns: Column<OutstandingSummary['distributorBalances'][0]>[] = [
    {
      header: 'Distributor Entity',
      accessor: (row) => (
        <div>
          <p className="font-bold text-textPrimary">{row.distributorName}</p>
          <p className="text-xs text-textMuted">Area: {row.salesArea}</p>
        </div>
      ),
    },
    {
      header: 'Invoices Count',
      accessor: (row) => <span className="text-xs font-semibold text-textSecondary">{row.invoiceCount} Bills</span>,
    },
    {
      header: 'Total Billed',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      header: 'Collections Paid',
      accessor: (row) => <span className="text-xs text-success">{formatCurrency(row.paidAmount)}</span>,
    },
    {
      header: 'Net Outstanding',
      accessor: (row) => <span className="font-extrabold text-danger">{formatCurrency(row.outstandingAmount)}</span>,
    },
    {
      header: 'Overdue Status',
      accessor: (row) => (
        <Badge variant={row.overdueDays > 0 ? 'danger' : 'success'}>
          {row.overdueDays > 0 ? `${row.overdueDays} Days Overdue` : 'Current'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Outstanding Financial Dues"
        description="Comprehensive audit view of distributor receivables and supplier payables."
        breadcrumb={['AquaNexus', 'Accountant', 'Outstanding']}
      />

      {/* Dual Financial Receivables vs Payables Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-primary to-primary-hover text-white">
          <CardHeader className="border-b-0 pb-0">
            <CardTitle className="text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              <AlertCircle size={18} className="text-warning" /> Total Distributor Receivables
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <h3 className="text-3xl font-extrabold">{formatCurrency(summary.totalDistributorOutstanding)}</h3>
            <p className="text-xs text-blue-100 mt-1">Pending payments due from authorized sales distributors</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border border-border">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-textSecondary">
              <DollarSign size={18} className="text-secondary" /> Total Supplier Payables Dues
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <h3 className="text-3xl font-extrabold text-textPrimary">{formatCurrency(summary.totalSupplierOutstanding)}</h3>
            <p className="text-xs text-textMuted mt-1">Outstanding bills due to raw material and packaging vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Distributor Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Distributor Receivables Aging Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table columns={columns} data={summary.distributorBalances} searchable={false} />
        </CardContent>
      </Card>
    </div>
  );
};
