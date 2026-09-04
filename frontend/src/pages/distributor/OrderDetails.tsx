import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle2, Clock, Truck, PackageCheck, XCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { distributorService } from '@/services/distributorService';
import { Order } from '@/types/distributor';
import { formatCurrency, formatDate } from '@/lib/utils';

export const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      if (!id) return;
      setLoading(true);
      const res = await distributorService.getOrderById(id);
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.message);
      }
      setLoading(false);
    }
    loadOrder();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Order Details" />
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <PageHeader title="Order Details" />
        <ErrorState message={error || 'Order not found'} />
      </DashboardLayout>
    );
  }

  const steps = [
    { title: 'Pending Approval', status: 'PENDING', icon: <Clock className="w-4 h-4" /> },
    { title: 'Confirmed', status: 'CONFIRMED', icon: <CheckCircle2 className="w-4 h-4" /> },
    { title: 'Dispatched', status: 'DISPATCHED', icon: <Truck className="w-4 h-4" /> },
    { title: 'Delivered', status: 'DELIVERED', icon: <PackageCheck className="w-4 h-4" /> },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'DISPATCHED': return 2;
      case 'DELIVERED': return 3;
      default: return -1;
    }
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <DashboardLayout>
      <PageHeader
        title={`Order #${order.orderNumber}`}
        description={`Placed on ${formatDate(order.orderDate)}`}
        action={
          <div className="flex items-center gap-3">
            <Link to="/distributor/orders">
              <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Orders
              </Button>
            </Link>
            <Link to="/distributor/invoices">
              <Button icon={<FileText className="w-4 h-4" />}>View Invoice</Button>
            </Link>
          </div>
        }
      />

      {/* Timeline Status */}
      <Card className="mb-6">
        <h3 className="font-semibold text-sm text-[#64748B] uppercase tracking-wider mb-4">Fulfillment Status Timeline</h3>
        {order.status === 'CANCELLED' ? (
          <div className="flex items-center gap-3 p-4 bg-[#DC2626]/10 text-[#DC2626] rounded-[8px] border border-[#DC2626]/20">
            <XCircle className="w-5 h-5" />
            <span className="font-semibold text-sm">This order was cancelled.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {steps.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              return (
                <div
                  key={step.status}
                  className={`p-3 rounded-[8px] border flex items-center gap-3 ${
                    isCompleted
                      ? 'bg-[#0F4C81]/10 border-[#0F4C81]/30 text-[#0F4C81]'
                      : 'bg-[#F5F8FB] border-[#E2E8F0] text-[#94A3B8]'
                  }`}
                >
                  <div className={`p-1.5 rounded-full ${isCompleted ? 'bg-[#0F4C81] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>
                    {step.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{step.title}</p>
                    <p className="text-[11px] opacity-75">{isCompleted ? 'Completed' : 'Pending'}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items Table */}
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-base text-[#172033] mb-4 pb-2 border-b border-[#E2E8F0]">Items Breakdown</h3>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3.5 bg-[#F5F8FB] rounded-[8px] border border-[#E2E8F0]">
                <div>
                  <h4 className="font-semibold text-sm text-[#172033]">{item.productName}</h4>
                  <p className="text-xs text-[#64748B]">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                </div>
                <div className="font-bold text-sm text-[#0F4C81]">{formatCurrency(item.totalPrice)}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
            <span className="font-bold text-base text-[#172033]">Total Order Amount</span>
            <span className="font-bold text-2xl text-[#0F4C81]">{formatCurrency(order.totalAmount)}</span>
          </div>
        </Card>

        {/* Distributor Metadata */}
        <Card className="space-y-4">
          <h3 className="font-semibold text-base text-[#172033] pb-2 border-b border-[#E2E8F0]">Order Info</h3>

          <div>
            <span className="text-xs text-[#64748B]">Distributor Entity</span>
            <p className="text-sm font-semibold text-[#172033]">{order.distributorName}</p>
          </div>

          <div>
            <span className="text-xs text-[#64748B]">Current Status</span>
            <div className="mt-1">
              <Badge status={order.status} />
            </div>
          </div>

          <div>
            <span className="text-xs text-[#64748B]">Delivery Address</span>
            <p className="text-sm font-medium text-[#172033] mt-0.5">{order.shippingAddress}</p>
          </div>

          {order.notes && (
            <div>
              <span className="text-xs text-[#64748B]">Notes</span>
              <p className="text-xs text-[#172033] bg-[#F5F8FB] p-2.5 rounded-[6px] border border-[#E2E8F0] mt-1">{order.notes}</p>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};
