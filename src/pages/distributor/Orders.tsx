import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Eye, FileText } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { Order, OrderStatus } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  useEffect(() => {
    async function fetchOrders() {
      const res = await apiClient.getOrders();
      if (res.success) setOrders(res.data);
    }
    fetchOrders();
  }, []);

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  const columns: Column<Order>[] = [
    {
      header: 'Order #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.orderNumber}</span>,
    },
    {
      header: 'Order Date',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.orderDate)}</span>,
    },
    {
      header: 'Items Summary',
      accessor: (row) => (
        <span className="text-xs text-textPrimary">
          {row.items.map(i => `${i.quantity} ${i.unit}s`).join(', ')}
        </span>
      ),
    },
    {
      header: 'Total Amount',
      accessor: (row) => <span className="font-bold text-textPrimary">{formatCurrency(row.totalAmount)}</span>,
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
            variant="secondary"
            onClick={() => navigate(`/distributor/orders/${row.id}`)}
            icon={Eye}
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
    <div className="space-y-6">
      <PageHeader
        title="Distributor Orders"
        description="Track plant orders, dispatch status, and itemized delivery manifests."
        breadcrumb={['AquaNexus', 'Distributor', 'Orders']}
        action={
          <Button onClick={() => navigate('/distributor/orders/create')} icon={Plus}>
            Create Order
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {statusTabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filterStatus === tab.value
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface text-textSecondary hover:bg-bgMain border border-border'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Table columns={columns} data={filteredOrders} searchPlaceholder="Search orders by number..." />
    </div>
  );
};
