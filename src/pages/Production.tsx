import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Factory } from 'lucide-react';

interface ProductionRow {
  line: string;
  item: string;
  target: number;
  produced: number;
  efficiency: string;
  status: 'running' | 'idle' | 'maintenance';
}

const MOCK_PROD: ProductionRow[] = [
  { line: 'Filling Line 1 (20L Jars)', item: '20L Reusable Jar', target: 3000, produced: 2850, efficiency: '95%', status: 'running' },
  { line: 'Bottling Line 2 (1L Packaged)', item: '1L PET Bottle', target: 10000, produced: 8200, efficiency: '82%', status: 'running' },
  { line: 'Pouch Line 3 (500ml)', item: '500ml Water Pouch', target: 5000, produced: 0, efficiency: '0%', status: 'maintenance' },
];

export default function ProductionPage() {
  const columns: Column<ProductionRow>[] = [
    { key: 'line', header: 'Production Line', render: (r) => <span className="font-bold text-[#0F4C81]">{r.line}</span> },
    { key: 'item', header: 'Output Product' },
    { key: 'target', header: 'Shift Target' },
    { key: 'produced', header: 'Actual Output' },
    { key: 'efficiency', header: 'Line Efficiency' },
    { 
      key: 'status', 
      header: 'Line Status', 
      render: (r) => {
        const map: Record<string, 'success' | 'warning' | 'danger'> = {
          running: 'success',
          idle: 'warning',
          maintenance: 'danger',
        };
        return <Badge variant={map[r.status]}>{r.status.toUpperCase()}</Badge>;
      }
    },
  ];

  return (
    <AuthGuard allowedRoles={['manager', 'admin', 'operator']}>
      <DashboardLayout>
        <PageHeader
          title="Production Line Operations"
          description="Batch monitoring, filling speed, and raw water purification output"
          breadcrumbs={[{ label: 'Operations' }, { label: 'Production' }]}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-[#0F4C81]" />
              <span>Plant Filling Lines Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table columns={columns} data={MOCK_PROD} />
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
