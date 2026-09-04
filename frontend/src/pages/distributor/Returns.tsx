import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { distributorService } from '@/services/distributorService';
import { ReturnRecord } from '@/types/distributor';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorReturns: React.FC = () => {
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReturns = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getReturns();
    if (res.success && res.data) {
      setReturns(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReturns();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title="Distributor Returns Log"
        description="Monitor goods returned to the central plant due to defects, damages, or recall."
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadReturns} />
      ) : (
        <Table<ReturnRecord>
          data={returns}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Return Ref', accessorKey: 'returnNumber', className: 'font-semibold text-[#0F4C81]' },
            { header: 'Product', accessorKey: 'productName', className: 'font-medium text-[#172033]' },
            { header: 'Quantity', cell: (row) => `${row.quantity} Units` },
            { header: 'Reason', accessorKey: 'reason', className: 'text-xs text-[#64748B]' },
            { header: 'Return Date', cell: (row) => formatDate(row.returnDate) },
            { header: 'Credit Amount', cell: (row) => formatCurrency(row.refundAmount) },
            { header: 'Status', cell: (row) => <Badge status={row.status} /> },
          ]}
        />
      )}
    </DashboardLayout>
  );
};
