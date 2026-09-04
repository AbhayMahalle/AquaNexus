import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Package,
  ShoppingCart,
  Boxes,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table } from '@/components/ui/Table';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { distributorService } from '@/services/distributorService';
import { DistributorDashboardData, Order } from '@/types/distributor';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorDashboard: React.FC = () => {
  const [data, setData] = useState<DistributorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getDashboard();
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Distributor Dashboard" description="Overview of authorized area operations and stock." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <PageHeader title="Distributor Dashboard" />
        <ErrorState message={error || 'Failed to load dashboard'} onRetry={loadData} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Distributor Dashboard"
        description={`Welcome back, ${data.distributorName}. Here is your sales and stock summary.`}
        action={
          <Link to="/distributor/orders/create">
            <Button icon={<Plus className="w-4 h-4" />}>Create New Order</Button>
          </Link>
        }
      />

      {/* Authorized Sales Area Banner */}
      <div className="bg-[#0F4C81] text-white p-4 rounded-[12px] mb-8 flex items-center justify-between shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <MapPin className="w-5 h-5 text-[#22B8CF]" />
          </div>
          <div>
            <p className="text-xs font-medium text-[#22B8CF] uppercase tracking-wider">Authorized Sales Area</p>
            <h3 className="text-base font-bold">{data.authorizedArea}</h3>
          </div>
        </div>
        <span className="text-xs bg-white/15 px-3 py-1 rounded-full font-medium">Verified Territory</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Card hoverEffect>
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Products</span>
            <Package className="w-4 h-4 text-[#1597D4]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{data.totalProductsAvailable}</div>
          <p className="text-xs text-[#64748B] mt-1">Available for order</p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Orders</span>
            <ShoppingCart className="w-4 h-4 text-[#0F4C81]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{data.activeOrdersCount}</div>
          <p className="text-xs text-[#64748B] mt-1">In processing & transit</p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock On Hand</span>
            <Boxes className="w-4 h-4 text-[#16A34A]" />
          </div>
          <div className="text-2xl font-bold text-[#172033]">{data.totalStockUnits} <span className="text-xs font-normal text-[#64748B]">Units</span></div>
          <p className="text-xs text-[#64748B] mt-1">In distributor warehouse</p>
        </Card>

        <Card hoverEffect>
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Outstanding Due</span>
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="text-2xl font-bold text-[#DC2626]">{formatCurrency(data.outstandingAmount)}</div>
          <p className="text-xs text-[#64748B] mt-1">Pending payment to plant</p>
        </Card>
      </div>

      {/* Recent Orders Section */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E2E8F0]">
          <div>
            <h3 className="font-semibold text-base text-[#172033]">Recent Orders</h3>
            <p className="text-xs text-[#64748B]">Track the status of your recent product restock requests.</p>
          </div>
          <Link to="/distributor/orders">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="w-4 h-4" />}>
              View All Orders
            </Button>
          </Link>
        </div>

        <Table<Order>
          data={data.recentOrders}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Order #', accessorKey: 'orderNumber', className: 'font-semibold text-[#0F4C81]' },
            { header: 'Date', cell: (row) => formatDate(row.orderDate) },
            { header: 'Items Count', cell: (row) => `${row.items.length} Product(s)` },
            { header: 'Total Amount', cell: (row) => formatCurrency(row.totalAmount) },
            { header: 'Status', cell: (row) => <Badge status={row.status} /> },
            {
              header: 'Action',
              cell: (row) => (
                <Link to={`/distributor/orders/${row.id}`}>
                  <Button variant="secondary" size="sm">
                    Details
                  </Button>
                </Link>
              ),
            },
          ]}
        />
      </Card>
    </DashboardLayout>
  );
};
