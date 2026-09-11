import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { apiClient } from '@/lib/api-client';
import { Invoice } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorOutstanding: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    async function loadInvoices() {
      const res = await apiClient.getInvoices();
      if (res.success) {
        setInvoices(res.data.filter(i => i.outstandingAmount > 0));
      }
    }
    loadInvoices();
  }, []);

  const totalOutstanding = invoices.reduce((acc, i) => acc + i.outstandingAmount, 0);

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.invoiceNumber}</span>,
    },
    {
      header: 'Order Reference',
      accessor: (row) => <span className="font-mono text-xs text-textSecondary">{row.orderNumber}</span>,
    },
    {
      header: 'Due Date',
      accessor: (row) => <span className="text-xs font-semibold text-textPrimary">{formatDate(row.dueDate)}</span>,
    },
    {
      header: 'Total Invoice',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      header: 'Amount Paid',
      accessor: (row) => <span className="text-xs text-success">{formatCurrency(row.paidAmount)}</span>,
    },
    {
      header: 'Pending Balance',
      accessor: (row) => <span className="font-bold text-danger">{formatCurrency(row.outstandingAmount)}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'OVERDUE' ? 'danger' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: () => (
        <Button size="sm" onClick={() => navigate('/distributor/payments')} icon={CreditCard}>
          Settle Dues
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor Outstanding Balances"
        description="Authoritative pending balance amounts derived from central plant invoice & payment records."
        breadcrumb={['AquaNexus', 'Distributor', 'Outstanding']}
      />

      {/* Summary Banner */}
      <Card className="bg-gradient-to-r from-primary to-primary-hover text-white">
        <div className="p-2 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl text-white">
              <AlertCircle size={32} />
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Total Pending Dues</p>
              <h2 className="text-3xl font-extrabold mt-0.5">{formatCurrency(totalOutstanding)}</h2>
              <p className="text-xs text-blue-100 mt-1">Across {invoices.length} outstanding invoice bills</p>
            </div>
          </div>
          <Button
            onClick={() => navigate('/distributor/payments')}
            variant="secondary"
            className="bg-white text-primary border-none font-semibold hover:bg-gray-100"
            icon={CreditCard}
          >
            Clear Outstanding Dues
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Invoice Dues Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table columns={columns} data={invoices} searchable={false} />
        </CardContent>
      </Card>
    </div>
  );
};
