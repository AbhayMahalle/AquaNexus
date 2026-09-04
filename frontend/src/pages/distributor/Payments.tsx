import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { distributorService } from '@/services/distributorService';
import { Payment } from '@/types/distributor';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getPayments();
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

  return (
    <DashboardLayout>
      <PageHeader
        title="Distributor Payments Log"
        description="Record of payment settlements submitted against issued plant invoices."
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayments} />
      ) : (
        <Table<Payment>
          data={payments}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Payment #', accessorKey: 'paymentNumber', className: 'font-semibold text-[#0F4C81]' },
            { header: 'Date', cell: (row) => formatDate(row.paymentDate) },
            { header: 'Method', cell: (row) => row.paymentMethod.replace('_', ' ') },
            { header: 'Reference ID', accessorKey: 'referenceNumber', className: 'font-mono text-xs text-[#64748B]' },
            { header: 'Amount Settlement', cell: (row) => formatCurrency(row.amount) },
            { header: 'Status', cell: (row) => <Badge status={row.status} /> },
          ]}
        />
      )}
    </DashboardLayout>
  );
};
