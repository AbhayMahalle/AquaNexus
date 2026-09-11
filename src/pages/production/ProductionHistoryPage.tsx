import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { productionService } from '../../services/productionService';
import type { Production } from '../../types';

export const ProductionHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<Production[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    productionService.getProductionBatches().then((res) => {
      if (res.success) {
        setHistory(res.data.filter((b) => b.status === 'COMPLETED'));
      }
      setIsLoading(false);
    });
  }, []);

  const columns = [
    {
      header: 'Batch Number',
      accessorKey: 'batchNumber' as keyof Production,
      cell: (b: Production) => <span className="font-semibold text-primary">{b.batchNumber}</span>,
    },
    {
      header: 'Product Name',
      accessorKey: 'productName' as keyof Production,
    },
    {
      header: 'Completed Quantity',
      cell: (b: Production) => (
        <span className="font-bold text-text-primary">
          {b.quantityProduced.toLocaleString()} {b.unit}
        </span>
      ),
    },
    {
      header: 'Production Date',
      accessorKey: 'productionDate' as keyof Production,
    },
    {
      header: 'Shift',
      accessorKey: 'shift' as keyof Production,
    },
    {
      header: 'Supervisor',
      accessorKey: 'supervisor' as keyof Production,
    },
    {
      header: 'Store Received',
      cell: (b: Production) => (
        <Badge variant={b.goodsReceivedStatus === 'RECEIVED' ? 'success' : 'neutral'}>
          {b.goodsReceivedStatus}
        </Badge>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Production History Logs"
        description="Historical log of completed water production batches and store inventory transfers."
        breadcrumbs={[
          { label: 'Production', href: '/production' },
          { label: 'History' },
        ]}
        action={
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export History Report
          </Button>
        }
      />

      <Table
        columns={columns}
        data={history}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyText="No historical production records found."
      />
    </div>
  );
};
