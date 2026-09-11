import React, { useEffect, useState } from 'react';
import { DollarSign, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { Payment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AccountantPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [activeTab, setActiveTab] = useState<'DISTRIBUTOR_PAYMENT' | 'SUPPLIER_PAYMENT' | 'SALARY_PAYMENT'>('DISTRIBUTOR_PAYMENT');

  useEffect(() => {
    async function loadPayments() {
      const res = await apiClient.getPayments();
      if (res.success) setPayments(res.data);
    }
    loadPayments();
  }, []);

  const filteredPayments = payments.filter(p => p.paymentType === activeTab);

  const columns: Column<Payment>[] = [
    {
      header: 'Payment #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.paymentNumber}</span>,
    },
    {
      header: 'Entity / Party Name',
      accessor: (row) => <span className="font-semibold text-textPrimary">{row.payerName}</span>,
    },
    {
      header: 'Txn Reference ID',
      accessor: (row) => <span className="font-mono text-xs text-textSecondary">{row.referenceId}</span>,
    },
    {
      header: 'Payment Method',
      accessor: (row) => <span className="text-xs text-textSecondary">{row.paymentMethod.replace('_', ' ')}</span>,
    },
    {
      header: 'Date',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.paymentDate)}</span>,
    },
    {
      header: 'Amount',
      accessor: (row) => (
        <span className={`font-bold ${row.paymentType === 'DISTRIBUTOR_PAYMENT' ? 'text-success' : 'text-danger'}`}>
          {row.paymentType === 'DISTRIBUTOR_PAYMENT' ? '+' : '-'}{formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => <Badge variant={row.status === 'PAID' ? 'success' : 'info'}>{row.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Financial Payments Portal"
        description="Unified portal for distributor incoming collections, supplier outgoing payouts, and employee salary disbursements."
        breadcrumb={['AquaNexus', 'Accountant', 'Payments']}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {[
          { label: 'Distributor Collections (Inflow)', value: 'DISTRIBUTOR_PAYMENT' },
          { label: 'Supplier Payouts (Outflow)', value: 'SUPPLIER_PAYMENT' },
          { label: 'Salary Disbursements', value: 'SALARY_PAYMENT' },
        ].map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(tab.value as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === tab.value
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface text-textSecondary hover:bg-bgMain border border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Table columns={columns} data={filteredPayments} searchPlaceholder="Search payments..." />
    </div>
  );
};
