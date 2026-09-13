import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Boxes,
  TrendingUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Shield,
  Clock,
  CheckCircle2,
  Truck
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { KPICard } from '@/components/ui/KPICard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LineChartWrapper } from '@/components/charts/LineChartWrapper';
import { apiClient } from '@/lib/api-client';
import { Order, DistributorStock } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stock, setStock] = useState<DistributorStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(false);
      const [ordRes, stockRes] = await Promise.all([
        apiClient.getOrders(),
        apiClient.getDistributorStock(),
      ]);
      if (ordRes.success) setOrders(ordRes.data);
      if (stockRes.success) setStock(stockRes.data);
    }
    loadData();
  }, []);

  const totalStockQuantity = stock.reduce((acc, item) => acc + item.quantity, 0);
  const activeOrdersCount = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED' || o.status === 'DISPATCHED').length;
  const monthSalesTotal = 32800; // Calculated sales for month
  const outstandingAmount = 9175; // Outstanding balance

  const salesTrendData = [
    { day: 'Mon', sales: 4500, orders: 2 },
    { day: 'Tue', sales: 8200, orders: 4 },
    { day: 'Wed', sales: 6100, orders: 3 },
    { day: 'Thu', sales: 12500, orders: 6 },
    { day: 'Fri', sales: 9400, orders: 5 },
    { day: 'Sat', sales: 11000, orders: 5 },
    { day: 'Sun', sales: 7200, orders: 3 },
  ];

  return (
    <div className="space-y-6">
      {/* Authorized Area Header Banner */}
      <div className="bg-primary text-white p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-wider mb-1">
            <Shield size={16} /> Authorized Distributor Area
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">AquaFlow Distribution (North Region)</h2>
          <p className="text-xs text-blue-100 mt-0.5">Assigned Authorized Sales Territory: Sector 1 to 24, Industrial & Commercial Hub</p>
        </div>
        <Button
          onClick={() => navigate('/distributor/orders/create')}
          variant="secondary"
          className="bg-white text-primary border-none hover:bg-gray-100 font-semibold"
          icon={Plus}
        >
          Place New Order
        </Button>
      </div>

      {/* Page Header */}
      <PageHeader
        title="Distributor Dashboard"
        description="Monitor stock availability, order statuses, sales performance, and outstanding balances."
        breadcrumb={['AquaNexus', 'Distributor', 'Dashboard']}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Available Warehouse Stock"
          value={`${totalStockQuantity} Units`}
          subtitle="Across 3 product categories"
          icon={Boxes}
        />
        <KPICard
          label="Active Orders"
          value={activeOrdersCount}
          subtitle="1 Dispatched, 1 Pending"
          icon={ShoppingCart}
          change="+1 new today"
          changeType="positive"
        />
        <KPICard
          label="Month Sales Revenue"
          value={formatCurrency(monthSalesTotal)}
          subtitle="vs ₹28,500 last month"
          icon={TrendingUp}
          change="+15.1%"
          changeType="positive"
        />
        <KPICard
          label="Outstanding Balance"
          value={formatCurrency(outstandingAmount)}
          subtitle="Invoice INV-2026-0308 due"
          icon={AlertCircle}
          statusBadge={<Badge variant="warning">Due Soon</Badge>}
        />
      </div>

      {/* Charts & Stock Status Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Sales Trend & Order Volume</CardTitle>
            <span className="text-xs text-textMuted font-medium">Last 7 Days Performance</span>
          </CardHeader>
          <CardContent>
            <LineChartWrapper
              data={salesTrendData}
              xKey="day"
              lines={[
                { key: 'sales', name: 'Revenue (₹)', color: '#0F4C81' },
                { key: 'orders', name: 'Orders Placed', color: '#22B8CF' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        {/* Distributor Warehouse Stock Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Distributor Stock Levels</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/distributor/stock')}>
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {stock.map(item => (
              <div key={item.id} className="p-3 bg-bgMain rounded-lg border border-border/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-textPrimary">{item.productName}</p>
                  <p className="text-[11px] text-textMuted mt-0.5">Threshold: {item.minThreshold} {item.unit}s</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-textPrimary">{item.quantity} {item.unit}s</span>
                  <div className="mt-1">
                    <Badge variant={item.status === 'AVAILABLE' ? 'success' : 'warning'}>
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Delivery Track */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Distributor Orders</CardTitle>
          <Button variant="secondary" size="sm" onClick={() => navigate('/distributor/orders')}>
            View Orders List
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {orders.map(order => (
              <div key={order.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary/10 text-secondary rounded-lg">
                    {order.status === 'DELIVERED' && <CheckCircle2 size={18} className="text-success" />}
                    {order.status === 'DISPATCHED' && <Truck size={18} className="text-info" />}
                    {order.status === 'PENDING' && <Clock size={18} className="text-warning" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-textPrimary">{order.orderNumber}</span>
                      <span className="text-xs text-textMuted">• {formatDate(order.orderDate)}</span>
                    </div>
                    <p className="text-xs text-textSecondary mt-0.5">
                      {order.items.length} Product Items ({order.items.map(i => i.productName).join(', ')})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-sm font-bold text-textPrimary">{formatCurrency(order.totalAmount)}</span>
                    <div className="mt-0.5">
                      <Badge
                        variant={
                          order.status === 'DELIVERED' ? 'success' : order.status === 'DISPATCHED' ? 'info' : 'warning'
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/distributor/orders/${order.id}`)}
                    icon={ArrowRight}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
