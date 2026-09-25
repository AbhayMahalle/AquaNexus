'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/services/apiClient';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, Column } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { NotificationsPanel } from '@/components/layout/NotificationsPanel';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  RotateCcw,
  AlertOctagon,
  AlertTriangle,
  FileCheck2,
  Boxes,
  ArrowRight,
  Activity,
  Plus,
  RefreshCw,
  Clock,
  ExternalLink
} from 'lucide-react';

interface StockMovementRow {
  id: string;
  reference: string;
  item: string;
  type: 'IN' | 'OUT' | 'RETURN' | 'DAMAGE';
  quantity: string;
  timestamp: string;
  handledBy: string;
  status: 'completed' | 'pending' | 'flagged';
}

interface LowStockAlertRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentLevel: string;
  minThreshold: string;
  severity: 'critical' | 'warning';
}

export default function DashboardPage() {
  // Shared type-safe table column definitions ready for real backend data connection
  const movementColumns: Column<StockMovementRow>[] = [
    {
      key: 'timestamp',
      header: 'Time / Date',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{r.timestamp}</span>
        </div>
      )
    },
    {
      key: 'reference',
      header: 'Slip / Ref #',
      render: (r) => <span className="font-mono text-xs font-semibold text-[#0F4C81]">{r.reference}</span>
    },
    {
      key: 'item',
      header: 'Item & Material',
      render: (r) => <span className="font-medium text-[#172033]">{r.item}</span>
    },
    {
      key: 'type',
      header: 'Movement Type',
      render: (r) => {
        const typeVariants: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger'; label: string }> = {
          IN: { variant: 'success', label: 'Stock IN' },
          OUT: { variant: 'info', label: 'Stock OUT' },
          RETURN: { variant: 'warning', label: 'Return' },
          DAMAGE: { variant: 'danger', label: 'Damage' },
        };
        const config = typeVariants[r.type] || { variant: 'info', label: r.type };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => <span className="font-mono font-bold text-xs">{r.quantity}</span>
    },
    {
      key: 'handledBy',
      header: 'Store Officer'
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusMap: Record<string, 'success' | 'warning' | 'danger'> = {
          completed: 'success',
          pending: 'warning',
          flagged: 'danger'
        };
        return <Badge variant={statusMap[r.status] || 'neutral'} size="sm">{r.status.toUpperCase()}</Badge>;
      }
    }
  ];

  const lowStockColumns: Column<LowStockAlertRow>[] = [
    {
      key: 'sku',
      header: 'SKU Code',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.sku}</span>
    },
    {
      key: 'name',
      header: 'Item Name',
      render: (r) => <span className="font-medium text-[#172033]">{r.name}</span>
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => <span className="text-xs text-[#64748B]">{r.category}</span>
    },
    {
      key: 'currentLevel',
      header: 'Current Stock',
      render: (r) => <span className="font-mono font-bold text-xs text-[#DC2626]">{r.currentLevel}</span>
    },
    {
      key: 'minThreshold',
      header: 'Min Threshold',
      render: (r) => <span className="font-mono text-xs text-[#64748B]">{r.minThreshold}</span>
    },
    {
      key: 'severity',
      header: 'Alert Level',
      render: (r) => (
        <Badge variant={r.severity === 'critical' ? 'danger' : 'warning'} size="sm">
          {r.severity.toUpperCase()}
        </Badge>
      )
    },
    {
      key: 'action',
      header: 'Action',
      render: () => (
        <Link href="/store/low-stock">
          <Button variant="outline" size="sm">
            Reorder
          </Button>
        </Link>
      )
    }
  ];

  const [recentMovements, setRecentMovements] = useState<StockMovementRow[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<LowStockAlertRow[]>([]);
  const [kpiCounts, setKpiCounts] = useState({
    currentStock: '0',
    stockIn: '0',
    stockOut: '0',
    pendingDispatch: '0',
    returns: '0',
    damaged: '0',
    lowStock: '0',
  });

  useEffect(() => {
    async function loadStoreData() {
      try {
        const [invRes, lowRes, txRes, retRes] = await Promise.all([
          fetchApi<{ inventory: any[] }>('/inventory'),
          fetchApi<{ lowStockItems: any[] } | any[]>('/inventory/low-stock'),
          fetchApi<{ transactions: any[] }>('/stock-transactions'),
          fetchApi<{ returns: any[] }>('/returns'),
        ]);

        let skuCount = 0;
        if (invRes.success && invRes.data) {
          const invList = invRes.data.inventory || (Array.isArray(invRes.data) ? invRes.data : []);
          skuCount = invList.length;
        }

        let lowList: any[] = [];
        if (lowRes.success && lowRes.data) {
          lowList = (lowRes.data as any).lowStockItems || (Array.isArray(lowRes.data) ? lowRes.data : []);
          setLowStockAlerts(
            lowList.map((item: any) => ({
              id: item.id,
              sku: item.product?.sku || item.sku || 'SKU',
              name: item.product?.name || item.name || 'Item',
              category: item.product?.category || item.category || 'General',
              currentLevel: `${item.quantity ?? item.currentLevel ?? 0} units`,
              minThreshold: `${item.reorderLevel ?? item.minimumStock ?? 50} units`,
              severity: (item.quantity ?? 0) <= 10 ? 'critical' : 'warning',
            }))
          );
        }

        let inCount = 0;
        let outCount = 0;
        let damCount = 0;

        if (txRes.success && txRes.data) {
          const txList = txRes.data.transactions || (Array.isArray(txRes.data) ? txRes.data : []);
          txList.forEach((t: any) => {
            if (t.transactionType === 'STOCK_IN' || t.transactionType === 'PRODUCTION_RECEIPT') inCount += t.quantity;
            else if (t.transactionType === 'STOCK_OUT' || t.transactionType === 'DISPATCH') outCount += t.quantity;
            else if (t.transactionType === 'DAMAGED') damCount += t.quantity;
          });

          setRecentMovements(
            txList.slice(0, 10).map((t: any) => ({
              id: t.id,
              reference: t.referenceNumber || t.id.slice(0, 8),
              item: t.product?.name || 'Stock Item',
              type: t.transactionType === 'STOCK_IN' || t.transactionType === 'PRODUCTION_RECEIPT' ? 'IN' : t.transactionType === 'RETURN' ? 'RETURN' : t.transactionType === 'DAMAGED' ? 'DAMAGE' : 'OUT',
              quantity: `${t.quantity} units`,
              timestamp: t.createdAt ? new Date(t.createdAt).toLocaleDateString() : 'Today',
              handledBy: t.creator ? `${t.creator.firstName || ''} ${t.creator.lastName || ''}`.trim() : 'Store Staff',
              status: 'completed',
            }))
          );
        }

        let retCount = 0;
        if (retRes.success && retRes.data) {
          const retList = retRes.data.returns || (Array.isArray(retRes.data) ? retRes.data : []);
          retList.forEach((r: any) => {
            if (Array.isArray(r.returnItems) && r.returnItems.length > 0) {
              r.returnItems.forEach((item: any) => {
                retCount += Number(item.quantity) || 0;
              });
            } else if (r.quantity) {
              retCount += Number(r.quantity) || 0;
            }
          });
        }

        setKpiCounts({
          currentStock: String(skuCount),
          stockIn: String(inCount),
          stockOut: String(outCount),
          pendingDispatch: '0',
          returns: String(retCount),
          damaged: String(damCount),
          lowStock: String(lowList.length),
        });
      } catch (err) {
        console.error('Store dashboard load error:', err);
      }
    }

    loadStoreData();
  }, []);

  const kpis = [
    {
      id: 'current-stock',
      label: 'Current Stock',
      value: kpiCounts.currentStock,
      unit: 'Active SKUs',
      subtext: 'Catalog items & raw materials',
      icon: <Package className="w-5 h-5 text-[#0F4C81]" />,
      badge: 'Live Sync',
      badgeVariant: 'primary' as const,
      bgIcon: 'bg-[#0F4C81]/10',
      href: '/store/inventory',
    },
    {
      id: 'stock-in',
      label: 'Stock IN',
      value: kpiCounts.stockIn,
      unit: 'Units Received',
      subtext: 'Production receipts & inward deliveries',
      icon: <ArrowDownToLine className="w-5 h-5 text-[#16A34A]" />,
      badge: 'Total In',
      badgeVariant: 'success' as const,
      bgIcon: 'bg-[#16A34A]/10',
      href: '/store/stock-in',
    },
    {
      id: 'stock-out',
      label: 'Stock OUT',
      value: kpiCounts.stockOut,
      unit: 'Units Issued',
      subtext: 'Issued lots & plant requisitions',
      icon: <ArrowUpFromLine className="w-5 h-5 text-[#1597D4]" />,
      badge: 'Total Out',
      badgeVariant: 'secondary' as const,
      bgIcon: 'bg-[#1597D4]/10',
      href: '/store/stock-out',
    },
    {
      id: 'pending-dispatch',
      label: 'Pending Dispatch',
      value: kpiCounts.pendingDispatch,
      unit: 'Queued Lots',
      subtext: 'Finished goods staged for exit',
      icon: <Truck className="w-5 h-5 text-[#2563EB]" />,
      badge: 'Staging',
      badgeVariant: 'info' as const,
      bgIcon: 'bg-[#2563EB]/10',
      href: '/store/dispatch',
    },
    {
      id: 'returns',
      label: 'Returns',
      value: kpiCounts.returns,
      unit: 'Returned Units',
      subtext: 'Customer jars & vendor returns',
      icon: <RotateCcw className="w-5 h-5 text-[#7C3AED]" />,
      badge: 'Audited',
      badgeVariant: 'neutral' as const,
      bgIcon: 'bg-[#7C3AED]/10',
      href: '/store/returns',
    },
    {
      id: 'damaged-goods',
      label: 'Damaged Goods',
      value: kpiCounts.damaged,
      unit: 'Defective Units',
      subtext: 'Damaged preforms, jars & scrap',
      icon: <AlertOctagon className="w-5 h-5 text-[#DC2626]" />,
      badge: 'Loss Log',
      badgeVariant: 'danger' as const,
      bgIcon: 'bg-[#DC2626]/10',
      href: '/store/damaged',
    },
    {
      id: 'low-stock',
      label: 'Low Stock',
      value: kpiCounts.lowStock,
      unit: 'Critical Items',
      subtext: 'Below minimum safety threshold',
      icon: <AlertTriangle className="w-5 h-5 text-[#D97706]" />,
      badge: 'Action Required',
      badgeVariant: 'warning' as const,
      bgIcon: 'bg-[#D97706]/10',
      href: '/store/low-stock',
    },
  ];

  const quickActions = [
    {
      title: 'Inward Consignment',
      description: 'Log raw materials & vendor shipments',
      href: '/store/stock-in',
      icon: <ArrowDownToLine className="w-4 h-4 text-[#16A34A]" />,
      btnText: 'Stock In',
    },
    {
      title: 'Issue to Bottling Line',
      description: 'Transfer preforms, caps & chemicals',
      href: '/store/stock-out',
      icon: <ArrowUpFromLine className="w-4 h-4 text-[#1597D4]" />,
      btnText: 'Stock Out',
    },
    {
      title: 'Generate GRN',
      description: 'Verify vendor PO delivery challan',
      href: '/store/goods-received',
      icon: <FileCheck2 className="w-4 h-4 text-[#0F4C81]" />,
      btnText: 'New GRN',
    },
    {
      title: 'Stage Outbound Dispatch',
      description: 'Prepare finished water loading slips',
      href: '/store/dispatch',
      icon: <Truck className="w-4 h-4 text-[#2563EB]" />,
      btnText: 'Dispatch',
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header with Breadcrumbs and Quick Navigation */}
        <PageHeader
          title="Store & Inventory Dashboard"
          description="Operational dashboard for plant material inventory, stock movements, dispatches, and warehouse threshold monitoring."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Dashboard' }
          ]}
          secondaryActions={[
            {
              label: 'Inventory Catalog',
              href: '/store/inventory',
              icon: <Boxes className="w-4 h-4" />,
            },
            {
              label: 'Goods Received (GRN)',
              href: '/store/goods-received',
              icon: <FileCheck2 className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Stock In Entry',
            href: '/store/stock-in',
            icon: <Plus className="w-4 h-4" />,
          }}
        />

        {/* 1. KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6">
          {kpis.map((kpi) => (
            <Link key={kpi.id} href={kpi.href} className="group">
              <Card variant="interactive" padding="sm" className="h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${kpi.bgIcon}`}>
                      {kpi.icon}
                    </div>
                    <Badge variant={kpi.badgeVariant} size="sm">
                      {kpi.badge}
                    </Badge>
                  </div>

                  <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                    {kpi.label}
                  </p>

                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
                      {kpi.value}
                    </span>
                    <span className="text-xs font-medium text-[#64748B]">
                      {kpi.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E2E8F0] text-xs text-[#64748B]">
                  <span className="truncate">{kpi.subtext}</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0 text-[#94A3B8] group-hover:text-[#0F4C81] group-hover:translate-x-0.5 transition-all" />
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* 2. Operational Overview & Store Movement Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Store Workflow Pipeline */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#1597D4]" />
                    <span>Store Inventory Flow Architecture</span>
                  </CardTitle>
                  <CardDescription>
                    End-to-end material flow from procurement receipt to production and distributor dispatch.
                  </CardDescription>
                </div>
                <Badge variant="primary" size="sm">Phase 1 Workflow</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F4C81] mb-1">
                    <ArrowDownToLine className="w-4 h-4 text-[#16A34A]" />
                    <span>1. Inward Supply</span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Raw preforms, bottle caps, water treatment chemicals, and labels received via GRN slips.
                  </p>
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#0F4C81] font-semibold">
                    <Link href="/store/goods-received" className="hover:underline flex items-center gap-1">
                      <span>View GRN Registry</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F4C81] mb-1">
                    <Package className="w-4 h-4 text-[#1597D4]" />
                    <span>2. Plant Inventory</span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Safety threshold monitoring, storage bin allocations, stock valuation, and balance ledgers.
                  </p>
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#0F4C81] font-semibold">
                    <Link href="/store/inventory" className="hover:underline flex items-center gap-1">
                      <span>View Catalog</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#0F4C81] mb-1">
                    <Truck className="w-4 h-4 text-[#2563EB]" />
                    <span>3. Outbound Dispatch</span>
                  </div>
                  <p className="text-xs text-[#64748B] leading-relaxed">
                    Finished 20L jars & packaged water loading manifests, vehicle gates, and jar return logs.
                  </p>
                  <div className="mt-3 pt-2 border-t border-[#E2E8F0] text-[11px] text-[#0F4C81] font-semibold">
                    <Link href="/store/dispatch" className="hover:underline flex items-center gap-1">
                      <span>Dispatch Staging</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Store Actions Panel */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Quick Operations</CardTitle>
              <CardDescription>Primary store transaction entries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-0">
              {quickActions.map((action, idx) => (
                <Link
                  key={idx}
                  href={action.href}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#F0F7FF] border border-[#E0F0FE] shrink-0">
                      {action.icon}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#172033] group-hover:text-[#0F4C81] transition-colors">
                        {action.title}
                      </h4>
                      <p className="text-[11px] text-[#64748B]">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F4C81] group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 3. Operational Data Tables: Recent Movements & Low-Stock Attention */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Store Movement Activity Table */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">Recent Store Activity & Movement</CardTitle>
                  <CardDescription>Latest material receipts, line issuances, and outbound consignments</CardDescription>
                </div>
                <Link href="/store/reports">
                  <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={movementColumns}
                data={recentMovements}
                emptyText="No store movement entries"
                emptyDescription="Stock inward and outward transactions will appear here as entries are logged."
              />
            </CardContent>
          </Card>

          {/* Critical Low-Stock & Reorder Attention */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                    <span>Low Stock Attention</span>
                  </CardTitle>
                  <CardDescription>Items below safety threshold</CardDescription>
                </div>
                <Link href="/store/low-stock">
                  <Badge variant="warning" size="sm">Monitor</Badge>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={lowStockColumns}
                data={lowStockAlerts}
                emptyText="Stock levels optimal"
                emptyDescription="All raw materials and finished water items currently meet required safety stock thresholds."
              />
            </CardContent>
          </Card>
        </div>

        <NotificationsPanel maxItems={4} />
      </DashboardLayout>
    </AuthGuard>
  );
}
