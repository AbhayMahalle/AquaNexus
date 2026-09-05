import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, Column } from '@/components/ui/Table';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  PackageSearch,
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Building2,
  Tag,
  Boxes,
  AlertTriangle,
  History
} from 'lucide-react';

interface ItemMovementHistoryRow {
  id: string;
  timestamp: string;
  reference: string;
  type: 'IN' | 'OUT' | 'RETURN' | 'DAMAGE' | 'ADJUSTMENT';
  quantity: string;
  balanceAfter: string;
  handledBy: string;
  notes?: string;
}

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();

  const historyColumns: Column<ItemMovementHistoryRow>[] = [
    {
      key: 'timestamp',
      header: 'Date & Time',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{r.timestamp}</span>
        </div>
      )
    },
    {
      key: 'reference',
      header: 'Reference Slip #',
      render: (r) => <span className="font-mono text-xs font-semibold text-[#0F4C81]">{r.reference}</span>
    },
    {
      key: 'type',
      header: 'Movement Type',
      render: (r) => {
        const typeVariants: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger' | 'neutral'; label: string }> = {
          IN: { variant: 'success', label: 'Stock IN' },
          OUT: { variant: 'info', label: 'Stock OUT' },
          RETURN: { variant: 'warning', label: 'Return' },
          DAMAGE: { variant: 'danger', label: 'Damage' },
          ADJUSTMENT: { variant: 'neutral', label: 'Adjustment' },
        };
        const config = typeVariants[r.type] || { variant: 'neutral', label: r.type };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => <span className="font-mono font-bold text-xs">{r.quantity}</span>
    },
    {
      key: 'balanceAfter',
      header: 'Balance After',
      render: (r) => <span className="font-mono text-xs font-semibold text-[#172033]">{r.balanceAfter}</span>
    },
    {
      key: 'handledBy',
      header: 'Store Officer'
    },
    {
      key: 'notes',
      header: 'Remarks / Notes',
      render: (r) => <span className="text-xs text-[#64748B]">{r.notes || '--'}</span>
    }
  ];

  // API-ready state
  const movementHistory: ItemMovementHistoryRow[] = [];

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title={id ? `Item Specification: ${id}` : 'Inventory Item Details'}
          description={`Comprehensive catalog profile, storage bin location, reorder thresholds, and ledger history for SKU ${id || 'N/A'}.`}
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Inventory', href: '/store/inventory' },
            { label: id ? `Item #${id}` : 'Item Details' }
          ]}
          secondaryActions={[
            {
              label: 'Back to Catalog',
              href: '/store/inventory',
              icon: <ArrowLeft className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Inward Stock Entry',
            href: '/store/stock-in',
            icon: <ArrowDownToLine className="w-4 h-4" />,
          }}
        />

        {/* 1. Item Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Main Item Profile Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <PackageSearch className="w-5 h-5 text-[#0F4C81]" />
                    <span>Product Specifications</span>
                  </CardTitle>
                  <CardDescription>Master item parameters and warehouse bin allocations</CardDescription>
                </div>
                <Badge variant="primary" size="sm">
                  SKU: {id || 'PENDING'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Current Quantity
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[#172033]">--</span>
                    <span className="text-xs text-[#64748B]">Units</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Minimum Threshold
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold text-[#D97706]">--</span>
                    <span className="text-xs text-[#64748B]">Reorder Level</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Stock Status
                  </span>
                  <div className="mt-1">
                    <Badge variant="neutral" size="sm">
                      AWAITING API
                    </Badge>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Category Classification
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172033] mt-1">
                    <Tag className="w-3.5 h-3.5 text-[#1597D4]" />
                    <span>--</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Storage Bin Location
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172033] mt-1">
                    <Building2 className="w-3.5 h-3.5 text-[#0F4C81]" />
                    <span>--</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block mb-1">
                    Last Stock Movement
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1">
                    <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
                    <span>--</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Item Operations</CardTitle>
              <CardDescription>Direct transactions for this item</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/store/stock-in" className="block">
                <Button variant="primary" size="sm" fullWidth leftIcon={<ArrowDownToLine className="w-4 h-4" />}>
                  Receive Stock In
                </Button>
              </Link>

              <Link to="/store/stock-out" className="block">
                <Button variant="outline" size="sm" fullWidth leftIcon={<ArrowUpFromLine className="w-4 h-4" />}>
                  Issue to Production
                </Button>
              </Link>

              <Link to="/store/low-stock" className="block">
                <Button variant="ghost" size="sm" fullWidth leftIcon={<AlertTriangle className="w-4 h-4 text-[#D97706]" />}>
                  Threshold Settings
                </Button>
              </Link>

              <Link to="/store/reports" className="block">
                <Button variant="ghost" size="sm" fullWidth leftIcon={<Boxes className="w-4 h-4 text-[#64748B]" />}>
                  Valuation Ledger
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* 2. Item Movement Ledger History Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-[#1597D4]" />
                  <span>Item Movement Ledger</span>
                </CardTitle>
                <CardDescription>
                  Chronological history of receipts, bottling line dispatches, returns, and scrap write-offs for this item.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={historyColumns}
              data={movementHistory}
              emptyText="No movement history recorded"
              emptyDescription={`There are no historical stock movements logged yet for item #${id || ''}. Log an inward or outward transaction to begin tracking.`}
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
