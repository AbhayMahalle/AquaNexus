import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Factory,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface ProductionBatch {
  id: string;
  batchNo: string;
  item: string;
  quantity: number;
  unit: string;
  operator: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  time: string;
}

const MOCK_BATCHES: ProductionBatch[] = [
  { id: '1', batchNo: 'BATCH-2026-089', item: '20L Jar Water', quantity: 2400, unit: 'Units', operator: 'Ramesh K.', status: 'completed', time: '10:30 AM' },
  { id: '2', batchNo: 'BATCH-2026-090', item: '1L Packaged Bottle', quantity: 5000, unit: 'Units', operator: 'Sunil P.', status: 'in_progress', time: '01:15 PM' },
  { id: '3', batchNo: 'BATCH-2026-091', item: '500ml Bottle Case', quantity: 1200, unit: 'Cases', operator: 'Amit S.', status: 'scheduled', time: '04:00 PM' },
];

export default function AdminDashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState('BATCH-2026-092');

  const productionColumns: Column<ProductionBatch>[] = [
    { key: 'batchNo', header: 'Batch No', render: (r) => <span className="font-mono font-bold text-[#F97316] text-xs">{r.batchNo}</span> },
    { key: 'item', header: 'Product Item', render: (r) => <span className="font-medium text-[#222222]">{r.item}</span> },
    { key: 'quantity', header: 'Quantity', render: (r) => `${formatNumber(r.quantity)} ${r.unit}` },
    { key: 'operator', header: 'Line Operator', render: (r) => <span className="text-[#666666]">{r.operator}</span> },
    { key: 'time', header: 'Timestamp', render: (r) => <span className="text-[#666666]">{r.time}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const variants: Record<string, 'success' | 'warning' | 'info'> = {
          completed: 'success',
          in_progress: 'warning',
          scheduled: 'info',
        };
        return <Badge variant={variants[r.status]}>{r.status.replace('_', ' ').toUpperCase()}</Badge>;
      }
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <PageHeader
          title="Admin Control Center"
          description="Real-time plant metrics, production overview, and ERP operational status"
          breadcrumbs={[{ label: 'Admin Dashboard' }]}
          primaryAction={{
            label: 'Log New Batch',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setIsModalOpen(true),
          }}
          secondaryActions={[
            {
              label: 'Export ERP Report',
              icon: <Download className="w-4 h-4" />,
              onClick: () => alert('Generating ERP Summary Report...'),
            }
          ]}
        />

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card variant="interactive" className="border-l-4 border-l-[#F97316]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#666666] uppercase tracking-wider">Today's Production</p>
                <h3 className="text-2xl font-extrabold text-[#222222] mt-1">48,500 <span className="text-xs font-medium text-[#666666]">Liters</span></h3>
                <p className="text-xs text-[#16A34A] font-semibold mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs yesterday
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#FFF7ED] text-[#F97316]">
                <Factory className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card variant="interactive" className="border-l-4 border-l-[#666666]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#666666] uppercase tracking-wider">Finished Stock</p>
                <h3 className="text-2xl font-extrabold text-[#222222] mt-1">14,250 <span className="text-xs font-medium text-[#666666]">Jars</span></h3>
                <p className="text-xs text-[#16A34A] font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stock level optimal
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F5F5] text-[#666666]">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card variant="interactive" className="border-l-4 border-l-[#16A34A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#666666] uppercase tracking-wider">Daily Sales Revenue</p>
                <h3 className="text-2xl font-extrabold text-[#222222] mt-1">{formatCurrency(184500)}</h3>
                <p className="text-xs text-[#16A34A] font-semibold mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +8.5% this week
                </p>
              </div>
              <div className="p-3 rounded-xl bg-[#F0FDF4] text-[#16A34A]">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card variant="interactive" className="border-l-4 border-l-[#F59E0B]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#666666] uppercase tracking-wider">Active Staff</p>
                <h3 className="text-2xl font-extrabold text-[#222222] mt-1">42 / 45</h3>
                <p className="text-xs text-[#666666] font-medium mt-1">Shift 1 active</p>
              </div>
              <div className="p-3 rounded-xl bg-[#FFFBEB] text-[#D97706]">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle>Active Production Batches</CardTitle>
                  <CardDescription>Live telemetry from plant filling lines</CardDescription>
                </div>
                <Badge variant="primary" icon={<Clock className="w-3 h-3" />}>Realtime</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table
                  columns={productionColumns}
                  data={MOCK_BATCHES}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#222222]">Raw Water Reserve</span>
                  <Badge variant="success">92% Capacity</Badge>
                </div>
                <p className="text-xs text-[#666666]">Inflow steady at 120 LPM from Borewell #1 & #2</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#222222]">UV & RO Filtration</span>
                  <Badge variant="success">Purity 38 PPM</Badge>
                </div>
                <p className="text-xs text-[#666666]">Conductivity and pH within certified standards</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E5E5] bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#222222]">Dispatch Queue</span>
                  <Badge variant="primary">6 Pending</Badge>
                </div>
                <p className="text-xs text-[#666666]">Agency vehicle loading at Bay 1 & Bay 2</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#F59E0B]" />
                  <span>Plant Operational Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#F59E0B] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#D97706]">RO Membrane Filter Cleaning</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">Scheduled for Line 2 at 06:00 PM</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#DC2626] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#DC2626]">Raw Water Tank 3 Level Low</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">Capacity at 18%. Borewell pump activated.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#F0FDF4] border border-[#86EFAC] flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#16A34A]">Quality Lab Clearance Passed</p>
                    <p className="text-[11px] text-[#666666] mt-0.5">Batch BATCH-089 purity TDS: 42 ppm</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#F97316]" />
                  <span>Plant Security & Compliance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-[#666666] space-y-2">
                <p>• ISO 22000 Water Safety: <strong className="text-[#16A34A]">Compliant</strong></p>
                <p>• BIS License Certification: <strong className="text-[#222222]">Active (CM/L-1234)</strong></p>
                <p>• Daily Water Testing Log: <strong className="text-[#16A34A]">Verified</strong></p>
                <p>• Plant Health & Safety: <strong className="text-[#222222]">100% Passed</strong></p>
              </CardContent>
            </Card>
          </div>
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create Production Batch"
          description="Log a new filling line batch into the ERP system"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => { setIsModalOpen(false); alert('Batch created!'); }}>Submit Batch</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input
              label="Batch Number"
              value={newBatchNo}
              onChange={(e) => setNewBatchNo(e.target.value)}
            />
            <Select
              label="Product Item"
              options={[
                { label: '20 Litre Water Jar', value: 'jar20' },
                { label: '1 Litre Packaged Bottle (12 Pcs)', value: 'b1l' },
                { label: '500ml Bottled Water (24 Pcs)', value: 'b500' },
              ]}
            />
            <Input
              label="Target Output Quantity"
              type="number"
              placeholder="e.g. 2500"
            />
          </div>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
