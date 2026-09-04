import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { accountantService } from '@/services/accountantService';
import { AccountantPayment } from '@/types/accountant';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AccountantPayments: React.FC = () => {
  const [payments, setPayments] = useState<AccountantPayment[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    const res = await accountantService.getPayments();
    if (res.success && res.data) {
      setPayments(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.partyName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Central Financial Payments Ledger"
        description="Comprehensive audit of distributor collections, supplier disbursements, and staff payroll transactions."
      />

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by ref # or party name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-64">
            <Select
              label="Transaction Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { label: 'All Transaction Types', value: 'ALL' },
                { label: 'Distributor Collection', value: 'DISTRIBUTOR_COLLECTION' },
                { label: 'Supplier Payment', value: 'SUPPLIER_PAYMENT' },
                { label: 'Salary Payment', value: 'SALARY_PAYMENT' },
                { label: 'Expense Payment', value: 'EXPENSE_PAYMENT' },
              ]}
            />
          </div>
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayments} />
      ) : (
        <Table<AccountantPayment>
          data={filteredPayments}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Payment Ref', accessorKey: 'paymentNumber', className: 'font-semibold text-[#0F4C81]' },
            { header: 'Type', cell: (row) => <span className="text-xs font-semibold text-[#64748B]">{row.type.replace(/_/g, ' ')}</span> },
            { header: 'Party / Description', accessorKey: 'partyName', className: 'font-medium text-[#172033]' },
            { header: 'Date', cell: (row) => formatDate(row.date) },
            { header: 'Method', cell: (row) => row.paymentMethod.replace('_', ' ') },
            { header: 'Ref Number', accessorKey: 'referenceNumber', className: 'font-mono text-xs text-[#64748B]' },
            { header: 'Amount', cell: (row) => <span className="font-bold text-sm text-[#0F4C81]">{formatCurrency(row.amount)}</span> },
            { header: 'Status', cell: (row) => <Badge status={row.status} /> },
          ]}
        />
      )}
    </DashboardLayout>
  );
};
