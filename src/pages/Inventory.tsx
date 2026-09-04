import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Package, Plus } from 'lucide-react';

interface ItemRow {
  sku: string;
  name: string;
  category: string;
  stock: number;
  minLevel: number;
  unit: string;
  status: 'optimal' | 'low' | 'critical';
}

const MOCK_STOCK: ItemRow[] = [
  { sku: 'RAW-CAP-28', name: '28mm Blue Screw Caps', category: 'Raw Materials', stock: 125000, minLevel: 20000, unit: 'Pcs', status: 'optimal' },
  { sku: 'RAW-PET-24G', name: '24g PET Preforms (1L)', category: 'Raw Materials', stock: 8500, minLevel: 10000, unit: 'Pcs', status: 'low' },
  { sku: 'FG-JAR-20L', name: 'Filled 20L Water Jars', category: 'Finished Goods', stock: 3200, minLevel: 500, unit: 'Jars', status: 'optimal' },
  { sku: 'CHEM-RO-ANT', name: 'RO Antiscalant Chemical', category: 'Water Treatment', stock: 45, minLevel: 50, unit: 'Liters', status: 'critical' },
];

export default function StoreInventoryPage() {
  const columns: Column<ItemRow>[] = [
    { key: 'sku', header: 'SKU Code', render: (r) => <span className="font-mono font-bold text-[#0F4C81] text-xs">{r.sku}</span> },
    { key: 'name', header: 'Material / Item Name', render: (r) => <span className="font-bold text-[#172033]">{r.name}</span> },
    { key: 'category', header: 'Category' },
    { key: 'stock', header: 'In Stock', render: (r) => `${r.stock.toLocaleString()} ${r.unit}` },
    { key: 'minLevel', header: 'Min Threshold' },
    { 
      key: 'status', 
      header: 'Stock Status', 
      render: (r) => {
        const map: Record<string, 'success' | 'warning' | 'danger'> = {
          optimal: 'success',
          low: 'warning',
          critical: 'danger',
        };
        return <Badge variant={map[r.status]}>{r.status.toUpperCase()}</Badge>;
      }
    },
  ];

  return (
    <AuthGuard allowedRoles={['manager', 'admin', 'store_manager']}>
      <DashboardLayout>
        <PageHeader
          title="Store & Inventory Shell (RAM)"
          description="Shared UI foundation ready for RAM to implement detailed Store logic"
          breadcrumbs={[{ label: 'Store' }, { label: 'Inventory' }]}
          primaryAction={{
            label: 'Stock Requisition',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => alert('Stock Entry Modal...'),
          }}
        />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1597D4]" />
              <span>Plant Raw Materials & Finished Goods</span>
            </CardTitle>
            <Badge variant="secondary">RAM Developer Base</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <Table columns={columns} data={MOCK_STOCK} />
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
