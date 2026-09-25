'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { Order, OrderStatus } from '@/types/business';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorOrders: React.FC = () => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getOrders();
      if (res.success) setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const columns: Column<Order>[] = [
    {
      header: 'Order #',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-orange-600 px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
          {row.orderNumber}
        </span>
      ),
    },
    {
      header: 'Order Date',
      accessor: (row) => <span className="text-xs text-gray-700 font-medium">{formatDate(row.orderDate)}</span>,
    },
    {
      header: 'Items Summary',
      accessor: (row) => (
        <span className="text-xs text-black font-medium">
          {row.items.map(i => `${i.quantity} ${i.unit}s`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      accessor: (row) => <span className="font-extrabold text-black">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'DELIVERED'
              ? 'success'
              : row.status === 'DISPATCHED'
              ? 'info'
              : row.status === 'CANCELLED'
              ? 'danger'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/distributor/orders/${row.id}`)}
            icon={Eye}
            className="bg-white text-black border-gray-300 hover:bg-gray-100"
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  const statusTabs: { label: string; value: string }[] = [
    { label: 'All Orders', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Dispatched', value: 'DISPATCHED' },
    { label: 'Delivered', value: 'DELIVERED' },
  ];

  return (
    <div className="space-y-6 text-black">
      <PageHeader
        title="Distributor Orders"
        description="Track plant orders, dispatch status, and itemized delivery manifests."
        breadcrumb={['AquaNexus', 'Distributor', 'Orders']}
        action={
          <Button
            onClick={() => router.push('/distributor/orders/create')}
            icon={Plus}
            variant="orange"
            className="bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30"
          >
            Create Order
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {statusTabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === tab.value
                ? 'bg-orange-500 text-black font-bold shadow-xs'
                : 'bg-white text-black hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Table
        columns={columns}
        data={filteredOrders}
        isLoading={loading}
        searchPlaceholder="Search orders by number..."
      />
    </div>
  );
};

export default DistributorOrders;
