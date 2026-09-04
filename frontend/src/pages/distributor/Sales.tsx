import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { distributorService } from '@/services/distributorService';
import { SaleRecord } from '@/types/distributor';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorSales: React.FC = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSales = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getSales();
    if (res.success && res.data) {
      setSales(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = sales.filter(
    (sale) =>
      sale.saleNumber.toLowerCase().includes(search.toLowerCase()) ||
      sale.customerArea.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Distributor Sales History"
        description="Track outbound product sales made to retailers and commercial customers in your area."
      />

      <Card className="mb-6">
        <div className="max-w-md">
          <Input
            placeholder="Search sales by sale # or customer area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadSales} />
      ) : (
        <Table<SaleRecord>
          data={filteredSales}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Sale Number', accessorKey: 'saleNumber', className: 'font-semibold text-[#0F4C81]' },
            { header: 'Date', cell: (row) => formatDate(row.saleDate) },
            { header: 'Customer / Area', accessorKey: 'customerArea', className: 'font-medium text-[#172033]' },
            { header: 'Items Sold', cell: (row) => `${row.itemsCount} Units` },
            { header: 'Revenue', cell: (row) => formatCurrency(row.totalAmount) },
            { header: 'Payment Status', cell: (row) => <Badge status={row.paymentStatus} /> },
          ]}
        />
      )}
    </DashboardLayout>
  );
};
