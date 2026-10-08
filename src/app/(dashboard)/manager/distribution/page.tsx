'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Truck, AlertCircle } from 'lucide-react';
import { orderService, Order } from '@/services/orderService';
import type { OrderStatus } from '@/types/business';

export default function ManagerDistributionPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    try {
      const updatedOrder = await orderService.updateOrderStatus(id, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)));
    } catch (err: any) {
      setErrorMsg(`API Error: Cannot update status to ${newStatus}. ${err.message}`);
      setTimeout(() => setErrorMsg(null), 5000);
    }
  };

  const columns: Column<Order>[] = [
    { key: 'orderNumber', header: 'Dispatch Order', render: (r) => <span className="font-mono font-bold text-[#0F4C81] text-xs">{r.orderNumber}</span> },
    { key: 'agency', header: 'Distributor Agency', render: (r) => <span className="font-bold text-[#172033]">{r.distributor?.name || 'N/A'}</span> },
    { key: 'route', header: 'Delivery Route', render: (r) => <span className="text-[#64748B]">{r.distributor?.route || 'N/A'}</span> },
    { key: 'qty', header: 'Quantity', render: (r) => <span className="font-medium text-[#172033]">{r.orderItems?.reduce((acc, curr) => acc + curr.quantity, 0)} Items</span> },
    { 
      key: 'status', 
      header: 'Status', 
      render: (r) => (
        <div className="w-40">
          <Select
            value={r.status}
            onChange={(e) => handleStatusChange(r.id, e.target.value as OrderStatus)}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'DISPATCHED', label: 'Dispatched' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ].filter((opt) => {
              if (opt.value === r.status) return true;
              const validTransitions: Record<string, string[]> = {
                'PENDING': ['CONFIRMED', 'CANCELLED'],
                'CONFIRMED': ['CANCELLED', 'DISPATCHED'],
                'DISPATCHED': ['DELIVERED'],
                'DELIVERED': [],
                'CANCELLED': []
              };
              return validTransitions[r.status]?.includes(opt.value);
            })}
          />
        </div>
      )
    },
  ];

  return (
    <AuthGuard allowedRoles={['manager', 'admin', 'distributor']}>
      <DashboardLayout>
        <PageHeader
          title="Manager Distribution & Dispatch"
          description="Manage distributor agency orders, delivery routes, and update vehicle dispatching statuses"
          breadcrumbs={[{ label: 'Operations' }, { label: 'Distribution' }]}
        />
        
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-status-danger rounded-md text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#0F4C81]" />
              <span>Agency Dispatch Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : (
              <Table columns={columns} data={orders} keyExtractor={(item) => item.id} />
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
