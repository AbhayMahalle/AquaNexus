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
import { DistributorStock } from '@/types/distributor';
import { formatDate } from '@/lib/utils';

export const DistributorStockPage: React.FC = () => {
  const [stock, setStock] = useState<DistributorStock[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStock = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getStock();
    if (res.success && res.data) {
      setStock(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStock();
  }, []);

  const filteredStock = stock.filter((item) =>
    item.productName.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Distributor Inventory Stock"
        description="Monitor physical stock currently present in your authorized local warehouse."
      />

      <Card className="mb-6">
        <div className="max-w-md">
          <Input
            placeholder="Search stock by product or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadStock} />
      ) : (
        <Table<DistributorStock>
          data={filteredStock}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Product Name', accessorKey: 'productName', className: 'font-semibold text-[#172033]' },
            { header: 'SKU', accessorKey: 'sku', className: 'font-mono text-xs text-[#64748B]' },
            {
              header: 'Current Stock',
              cell: (row) => (
                <span className="font-bold text-sm text-[#0F4C81]">
                  {row.currentStock} {row.unit}s
                </span>
              ),
            },
            { header: 'Last Restocked', cell: (row) => formatDate(row.lastUpdated) },
            { header: 'Stock Status', cell: (row) => <Badge status={row.status} /> },
          ]}
        />
      )}
    </DashboardLayout>
  );
};
