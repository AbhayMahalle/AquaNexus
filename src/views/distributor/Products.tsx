'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { Product } from '@/types/business';
import { formatCurrency } from '@/lib/utils';

export const DistributorProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getProducts();
      if (res.success) setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const columns: Column<Product>[] = [
    {
      header: 'Product Code',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-orange-600 px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
          {row.productCode}
        </span>
      ),
    },
    {
      header: 'Product Name',
      accessor: (row) => (
        <div>
          <p className="font-bold text-black">{row.name}</p>
          <p className="text-xs text-gray-500">{row.category}</p>
        </div>
      ),
    },
    {
      header: 'Packaging Unit',
      accessor: (row) => <span className="text-xs font-semibold text-gray-700">{row.unit}</span>,
    },
    {
      header: 'Wholesale Price',
      accessor: (row) => <span className="font-extrabold text-black text-sm">{formatCurrency(row.unitPrice)}</span>,
    },
    {
      header: 'Plant Stock Status',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Badge variant={row.status === 'AVAILABLE' ? 'success' : row.status === 'LOW_STOCK' ? 'warning' : 'danger'}>
            {row.status.replace('_', ' ')}
          </Badge>
          <span className="text-[11px] text-gray-500 font-medium">({row.availableStock} {row.unit}s)</span>
        </div>
      ),
    },
    {
      header: 'Action',
      accessor: (row) => (
        <Button
          size="sm"
          variant="orange"
          disabled={row.status === 'OUT_OF_STOCK'}
          onClick={() => navigate(-1)}
          icon={ShoppingCart}
          className="bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30"
        >
          Order Product
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-black">
      <PageHeader
        title="Available Plant Products"
        description="Authorized live plant catalog products available for immediate bulk ordering and territory distribution."
        breadcrumb={['AquaNexus', 'Distributor', 'Products']}
        action={
          <Button
            onClick={() => navigate(-1)}
            icon={ShoppingCart}
            variant="orange"
            className="bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30"
          >
            Create Bulk Order
          </Button>
        }
      />

      <Table
        columns={columns}
        data={products}
        isLoading={loading}
        searchPlaceholder="Search products by code, name, category..."
      />
    </div>
  );
};

export default DistributorProducts;
