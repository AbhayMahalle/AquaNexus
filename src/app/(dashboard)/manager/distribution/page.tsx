'use client';
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Truck, AlertCircle } from 'lucide-react';
import type { OrderStatus } from '@/types/business';

interface OrderRow {
  orderNo: string;
  agency: string;
  route: string;
  qty: string;
  status: OrderStatus;
}

const INITIAL_MOCK_ORDERS: OrderRow[] = [
  { orderNo: 'ORD-2026-104', agency: 'Star Water Distributors', route: 'Kothrud - Route A', qty: '450 Jars', status: 'DISPATCHED' },
  { orderNo: 'ORD-2026-105', agency: 'Apex Beverages', route: 'Hadapsar - Route C', qty: '800 Cases (1L)', status: 'PENDING' },
  { orderNo: 'ORD-2026-106', agency: 'Crystal Springs Agency', route: 'Viman Nagar - Route B', qty: '600 Jars', status: 'DELIVERED' },
];

export default function ManagerDistributionPage() {
  const [orders, setOrders] = useState<OrderRow[]>(INITIAL_MOCK_ORDERS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStatusChange = async (orderNo: string, newStatus: OrderStatus) => {
    // Requirements stipulate we MUST NOT fake a backend API or change it.
    // Since there is no distributionService/orderService, we must report it clearly.
    setErrorMsg(`API Error: Cannot update status to ${newStatus}. No backend API service found for distribution/orders.`);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const columns: Column<OrderRow>[] = [
    { key: 'orderNo', header: 'Dispatch Order', render: (r) => <span className="font-mono font-bold text-[#0F4C81] text-xs">{r.orderNo}</span> },
    { key: 'agency', header: 'Distributor Agency', render: (r) => <span className="font-bold text-[#172033]">{r.agency}</span> },
    { key: 'route', header: 'Delivery Route', render: (r) => <span className="text-[#64748B]">{r.route}</span> },
    { key: 'qty', header: 'Quantity', render: (r) => <span className="font-medium text-[#172033]">{r.qty}</span> },
    { 
      key: 'status', 
      header: 'Status', 
      render: (r) => (
        <div className="w-40">
          <Select
            value={r.status}
            onChange={(e) => handleStatusChange(r.orderNo, e.target.value as OrderStatus)}
            options={[
              { value: 'PENDING', label: 'Pending' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'DISPATCHED', label: 'Dispatched' },
              { value: 'DELIVERED', label: 'Delivered' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
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
            <Table columns={columns} data={orders} keyExtractor={(item) => item.orderNo} />
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
