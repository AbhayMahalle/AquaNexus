import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, CheckCircle2, Clock, FileText, Building } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { apiClient } from '@/lib/api-client';
import { Order, OrderItem } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (id) {
        const res = await apiClient.getOrderById(id);
        if (res.success && res.data) {
          setOrder(res.data);
        }
      }
    }
    loadOrder();
  }, [id]);

  if (!order) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-textSecondary">Loading order details...</p>
      </div>
    );
  }

  const columns: Column<OrderItem>[] = [
    {
      header: 'Product Name',
      accessor: (row) => <span className="font-semibold text-textPrimary">{row.productName}</span>,
    },
    {
      header: 'Unit Price',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatCurrency(row.unitPrice)}</span>,
    },
    {
      header: 'Quantity',
      accessor: (row) => <span className="font-bold text-textPrimary">{row.quantity} {row.unit}s</span>,
    },
    {
      header: 'Line Total',
      accessor: (row) => <span className="font-bold text-primary">{formatCurrency(row.totalPrice)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed on ${formatDate(order.orderDate)} • Distributor: ${order.distributorName}`}
        breadcrumb={['AquaNexus', 'Distributor', 'Orders', order.orderNumber]}
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => navigate('/distributor/orders')} icon={ArrowLeft}>
              Back
            </Button>
            <Button onClick={() => navigate('/distributor/invoices')} icon={FileText}>
              View Invoice
            </Button>
          </div>
        }
      />

      {/* Dispatch Timeline Tracker */}
      <Card>
        <CardHeader>
          <CardTitle>Dispatch & Delivery Status</CardTitle>
          <Badge
            variant={
              order.status === 'DELIVERED'
                ? 'success'
                : order.status === 'DISPATCHED'
                ? 'info'
                : 'warning'
            }
          >
            {order.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="flex items-center gap-3 p-3 bg-bgMain rounded-xl border border-border">
              <Clock className="text-warning" size={24} />
              <div>
                <p className="text-xs font-bold text-textPrimary">1. Order Submitted</p>
                <p className="text-[11px] text-textMuted">{formatDate(order.orderDate)}</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${order.status === 'DISPATCHED' || order.status === 'DELIVERED' ? 'bg-bgMain border-border' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
              <Truck className="text-info" size={24} />
              <div>
                <p className="text-xs font-bold text-textPrimary">2. Dispatched from Store</p>
                <p className="text-[11px] text-textMuted">{order.status === 'DISPATCHED' || order.status === 'DELIVERED' ? 'Dispatched via Fleet Truck #04' : 'Awaiting Store Dispatch'}</p>
              </div>
            </div>
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${order.status === 'DELIVERED' ? 'bg-bgMain border-border' : 'bg-gray-50 border-gray-200 opacity-50'}`}>
              <CheckCircle2 className="text-success" size={24} />
              <div>
                <p className="text-xs font-bold text-textPrimary">3. Delivered & Received</p>
                <p className="text-[11px] text-textMuted">{order.status === 'DELIVERED' ? 'Received at Warehouse' : 'Pending Receipt'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itemized Table & Delivery Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Items Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table columns={columns} data={order.items} searchable={false} />
            </CardContent>
          </Card>
        </div>

        {/* Address & Financial Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-textMuted uppercase tracking-wider block mb-1">Delivery Address</span>
                <p className="font-medium text-textPrimary bg-bgMain p-2.5 rounded-lg border border-border">{order.deliveryAddress}</p>
              </div>
              {order.notes && (
                <div>
                  <span className="font-semibold text-textMuted uppercase tracking-wider block mb-1">Notes</span>
                  <p className="text-textSecondary italic">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <div className="flex justify-between text-textSecondary">
                <span>Subtotal</span>
                <span className="font-semibold text-textPrimary">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>GST Tax (5%)</span>
                <span className="font-semibold text-textPrimary">{formatCurrency(order.taxAmount)}</span>
              </div>
              <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold text-textPrimary">
                <span>Total Amount</span>
                <span className="text-lg font-extrabold text-primary">{formatCurrency(order.totalAmount)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
