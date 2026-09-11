import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { DistributorStock } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export const DistributorStockPage: React.FC = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState<DistributorStock[]>([]);

  useEffect(() => {
    async function loadStock() {
      const res = await apiClient.getDistributorStock();
      if (res.success) setStock(res.data);
    }
    loadStock();
  }, []);

  const columns: Column<DistributorStock>[] = [
    {
      header: 'Product Name',
      accessor: (row) => <span className="font-semibold text-textPrimary">{row.productName}</span>,
    },
    {
      header: 'Current Warehouse Stock',
      accessor: (row) => <span className="font-extrabold text-primary text-sm">{row.quantity} {row.unit}s</span>,
    },
    {
      header: 'Min Threshold',
      accessor: (row) => <span className="text-xs text-textMuted">{row.minThreshold} {row.unit}s</span>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'AVAILABLE' ? 'success' : row.status === 'LOW_STOCK' ? 'warning' : 'danger'}>
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Last Restocked',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.lastUpdated)}</span>,
    },
    {
      header: 'Action',
      accessor: (row) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => navigate('/distributor/orders/create')}
          icon={Plus}
        >
          Reorder Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor Warehouse Stock"
        description="Monitor physical inventory levels held in authorized distributor warehouse."
        breadcrumb={['AquaNexus', 'Distributor', 'Stock']}
        action={
          <Button onClick={() => navigate('/distributor/orders/create')} icon={Plus}>
            Reorder Stock
          </Button>
        }
      />

      <Table columns={columns} data={stock} searchPlaceholder="Search distributor stock..." />
    </div>
  );
};
