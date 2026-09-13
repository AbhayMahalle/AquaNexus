import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export const DistributorProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const res = await apiClient.getProducts();
      if (res.success) setProducts(res.data);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const columns: Column<Product>[] = [
    {
      header: 'Product Code',
      accessor: (row) => <span className="font-mono text-xs font-semibold text-primary">{row.productCode}</span>,
    },
    {
      header: 'Product Name',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-textPrimary">{row.name}</p>
          <p className="text-xs text-textMuted">{row.category}</p>
        </div>
      ),
    },
    {
      header: 'Unit',
      accessor: (row) => <span className="text-xs font-medium text-textSecondary">{row.unit}</span>,
    },
    {
      header: 'Wholesale Price',
      accessor: (row) => <span className="font-bold text-textPrimary">{formatCurrency(row.unitPrice)}</span>,
    },
    {
      header: 'Plant Stock Status',
      accessor: (row) => (
        <Badge variant={row.status === 'AVAILABLE' ? 'success' : row.status === 'LOW_STOCK' ? 'warning' : 'danger'}>
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: (row) => (
        <Button
          size="sm"
          variant="secondary"
          disabled={row.status === 'OUT_OF_STOCK'}
          onClick={() => navigate('/distributor/orders/create')}
          icon={ShoppingCart}
        >
          Order Product
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available Plant Products"
        description="Authorized products available for order and distribution in your assigned sales area."
        breadcrumb={['AquaNexus', 'Distributor', 'Products']}
        action={
          <Button onClick={() => navigate('/distributor/orders/create')} icon={ShoppingCart}>
            Create Bulk Order
          </Button>
        }
      />

      <Table columns={columns} data={products} searchPlaceholder="Search products by code or name..." />
    </div>
  );
};
