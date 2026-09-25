'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, AlertTriangle, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { DistributorStock } from '@/types/business';
import { formatDate } from '@/lib/utils';

export const DistributorStockPage: React.FC = () => {
  const navigate = useNavigate();
  const [stock, setStock] = useState<DistributorStock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStock = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getDistributorStock();
      if (res.success) setStock(res.data);
    } catch (err) {
      console.error('Failed to load distributor stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const totalUnits = stock.reduce((sum, s) => sum + s.quantity, 0);
  const lowStockCount = stock.filter((s) => s.status === 'LOW_STOCK' || s.status === 'OUT_OF_STOCK').length;

  const columns: Column<DistributorStock>[] = [
    {
      header: 'Product Name',
      accessor: (row) => <span className="font-bold text-black">{row.productName}</span>,
    },
    {
      header: 'Current Warehouse Stock',
      accessor: (row) => (
        <span className="font-extrabold text-orange-600 text-sm">
          {row.quantity} {row.unit}s
        </span>
      ),
    },
    {
      header: 'Min Threshold',
      accessor: (row) => <span className="text-xs text-gray-600 font-medium">{row.minThreshold} {row.unit}s</span>,
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
      accessor: (row) => <span className="text-xs text-gray-700">{formatDate(row.lastUpdated)}</span>,
    },
    {
      header: 'Action',
      accessor: (row) => (
        <Button
          size="sm"
          variant="orange"
          onClick={() => navigate(-1)}
          icon={Plus}
          className="bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30"
        >
          Reorder Stock
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-black">
      <PageHeader
        title="Distributor Warehouse Stock"
        description="Monitor physical inventory levels held in your authorized distributor warehouse."
        breadcrumb={['AquaNexus', 'Distributor', 'Stock']}
        action={
          <Button
            onClick={() => navigate(-1)}
            icon={Plus}
            variant="orange"
            className="bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30"
          >
            Reorder Stock
          </Button>
        }
      />

      {/* Stock Summary Mini Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">Total Units in Stock</p>
            <h3 className="text-2xl font-extrabold text-black mt-1">{totalUnits} Units</h3>
          </div>
          <div className="p-3 bg-orange-50 text-orange-600 border border-orange-200 rounded-xl">
            <Boxes size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">Low Stock Warnings</p>
            <h3 className={`text-2xl font-extrabold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {lowStockCount} Items
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-600">Active SKUs</p>
            <h3 className="text-2xl font-extrabold text-black mt-1">{stock.length} Products</h3>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl">
            <Boxes size={24} />
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={stock}
        isLoading={loading}
        searchPlaceholder="Search distributor stock..."
      />
    </div>
  );
};

export default DistributorStockPage;
