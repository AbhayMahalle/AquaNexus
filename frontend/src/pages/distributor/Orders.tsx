import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { distributorService } from '@/services/distributorService';
import { Order } from '@/types/distributor';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getOrders();
    if (res.success && res.data) {
      setOrders(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.shippingAddress.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Order Management"
        description="View and track your product restock requests sent to the central plant."
        action={
          <Link to="/distributor/orders/create">
            <Button icon={<Plus className="w-4 h-4" />}>Create Order</Button>
          </Link>
        }
      />

      {/* Filters Bar */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by order #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { label: 'All Statuses', value: 'ALL' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Confirmed', value: 'CONFIRMED' },
                { label: 'Dispatched', value: 'DISPATCHED' },
                { label: 'Delivered', value: 'DELIVERED' },
                { label: 'Cancelled', value: 'CANCELLED' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadOrders} />
      ) : (
        <Table<Order>
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Order Number', accessorKey: 'orderNumber', className: 'font-semibold text-[#0F4C81]' },
            { header: 'Date', cell: (row) => formatDate(row.orderDate) },
            { header: 'Line Items', cell: (row) => `${row.items.length} item(s)` },
            { header: 'Total Value', cell: (row) => formatCurrency(row.totalAmount) },
            { header: 'Status', cell: (row) => <Badge status={row.status} /> },
            {
              header: 'Actions',
              cell: (row) => (
                <Link to={`/distributor/orders/${row.id}`}>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      )}
    </DashboardLayout>
  );
};
