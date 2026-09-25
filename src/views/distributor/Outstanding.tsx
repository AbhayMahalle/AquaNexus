'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CreditCard, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { apiClient } from '@/lib/api-client';
import { Invoice } from '@/types/business';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorOutstanding: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getInvoices();
      if (res.success) {
        setInvoices(res.data.filter((i) => i.outstandingAmount > 0));
      }
    } catch (err) {
      console.error('Failed to load outstanding invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const totalOutstanding = invoices.reduce((acc, i) => acc + i.outstandingAmount, 0);

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-orange-600 px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      header: 'Order Reference',
      accessor: (row) => <span className="font-mono text-xs text-gray-700 font-medium">{row.orderNumber}</span>,
    },
    {
      header: 'Due Date',
      accessor: (row) => <span className="text-xs font-semibold text-black">{formatDate(row.dueDate)}</span>,
    },
    {
      header: 'Total Invoice',
      accessor: (row) => <span className="text-xs text-gray-700">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      header: 'Amount Paid',
      accessor: (row) => <span className="text-xs font-bold text-green-700">{formatCurrency(row.paidAmount)}</span>,
    },
    {
      header: 'Pending Balance',
      accessor: (row) => <span className="font-extrabold text-black">{formatCurrency(row.outstandingAmount)}</span>,
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
        <Button
          size="sm"
          variant="orange"
          onClick={() => navigate(-1)}
          icon={CreditCard}
          className="bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30"
        >
          Settle Dues
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-black">
      <PageHeader
        title="Distributor Outstanding Balances"
        description="Authoritative pending balance amounts derived from central plant invoice & payment records."
        breadcrumb={['AquaNexus', 'Distributor', 'Outstanding']}
      />

      {/* Summary Banner */}
      <div className="bg-white text-black p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-gray-200 border-l-4 border-l-orange-500 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 border border-orange-200 rounded-2xl">
            <AlertCircle size={32} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Total Pending Dues</p>
            <h2 className="text-3xl font-extrabold text-black mt-0.5">{formatCurrency(totalOutstanding)}</h2>
            <p className="text-xs text-gray-600 mt-1">Across {invoices.length} outstanding invoice bills</p>
          </div>
        </div>
        <Button
          onClick={() => navigate(-1)}
          variant="orange"
          className="bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30"
          icon={CreditCard}
        >
          Clear Outstanding Dues
        </Button>
      </div>

      <Card className="bg-white border border-gray-200 shadow-xs">
        <CardHeader>
          <CardTitle>Pending Invoice Dues Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={invoices}
            isLoading={loading}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default DistributorOutstanding;
