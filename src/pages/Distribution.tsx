import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Truck } from 'lucide-react';

interface OrderRow {
  orderNo: string;
  agency: string;
  route: string;
  qty: string;
  status: 'dispatched' | 'pending' | 'delivered';
}

const MOCK_ORDERS: OrderRow[] = [
  { orderNo: 'ORD-2026-104', agency: 'Star Water Distributors', route: 'Kothrud - Route A', qty: '450 Jars', status: 'dispatched' },
  { orderNo: 'ORD-2026-105', agency: 'Apex Beverages', route: 'Hadapsar - Route C', qty: '800 Cases (1L)', status: 'pending' },
  { orderNo: 'ORD-2026-106', agency: 'Crystal Springs Agency', route: 'Viman Nagar - Route B', qty: '600 Jars', status: 'delivered' },
];

export default function DistributionPage() {
  const columns: Column<OrderRow>[] = [
    { key: 'orderNo', header: 'Dispatch Order', render: (r) => <span className="font-mono font-bold text-[#F97316] text-xs">{r.orderNo}</span> },
    { key: 'agency', header: 'Distributor Agency', render: (r) => <span className="font-bold text-[#222222]">{r.agency}</span> },
    { key: 'route', header: 'Delivery Route', render: (r) => <span className="text-[#666666]">{r.route}</span> },
    { key: 'qty', header: 'Quantity', render: (r) => <span className="font-medium text-[#222222]">{r.qty}</span> },
    { 
      key: 'status', 
      header: 'Status', 
      render: (r) => {
        const map: Record<string, 'info' | 'warning' | 'success'> = {
          dispatched: 'info',
          pending: 'warning',
          delivered: 'success',
        };
        return <Badge variant={map[r.status]}>{r.status.toUpperCase()}</Badge>;
      }
    },
  ];

  return (
    <AuthGuard allowedRoles={['manager', 'admin', 'distributor']}>
      <DashboardLayout>
        <PageHeader
          title="Distribution & Dispatch Log"
          description="Track distributor agency orders, delivery routes, and vehicle dispatching"
          breadcrumbs={[{ label: 'Operations' }, { label: 'Distribution' }]}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#F97316]" />
              <span>Agency Dispatch Orders</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table columns={columns} data={MOCK_ORDERS} />
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
