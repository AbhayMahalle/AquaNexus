'use client';
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
import { NotificationsPanel } from '@/components/layout/NotificationsPanel';
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
  manager: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  time: string;
}

const MOCK_BATCHES: ProductionBatch[] = [
  { id: '1', batchNo: 'BATCH-2026-089', item: '20L Jar Water', quantity: 2400, unit: 'Units', manager: 'Ramesh K.', status: 'completed', time: '10:30 AM' },
  { id: '2', batchNo: 'BATCH-2026-090', item: '1L Packaged Bottle', quantity: 5000, unit: 'Units', manager: 'Sunil P.', status: 'in_progress', time: '01:15 PM' },
  { id: '3', batchNo: 'BATCH-2026-091', item: '500ml Bottle Case', quantity: 1200, unit: 'Cases', manager: 'Amit S.', status: 'scheduled', time: '04:00 PM' },
];

export default function AdminDashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatchNo, setNewBatchNo] = useState('BATCH-2026-092');

  const productionColumns: Column<ProductionBatch>[] = [
    {
      key: 'batchNo',
      header: <span className="text-black font-bold">Batch No</span>,
      render: (r) => (
        <span className="font-mono font-bold text-orange-600 text-xs px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
          {r.batchNo}
        </span>
      ),
    },
    {
      key: 'item',
      header: <span className="text-black font-bold">Product Item</span>,
      render: (r) => <span className="font-semibold text-black">{r.item}</span>,
    },
    {
      key: 'quantity',
      header: <span className="text-black font-bold">Quantity</span>,
      render: (r) => <span className="font-medium text-black">{`${formatNumber(r.quantity)} ${r.unit}`}</span>,
    },
    {
      key: 'manager',
      header: <span className="text-black font-bold">Line manager</span>,
      render: (r) => <span className="text-gray-700 font-medium">{r.manager}</span>,
    },
    {
      key: 'time',
      header: <span className="text-black font-bold">Timestamp</span>,
      render: (r) => <span className="text-gray-600">{r.time}</span>,
    },
    {
      key: 'status',
      header: <span className="text-black font-bold">Status</span>,
      render: (r) => {
        if (r.status === 'in_progress') {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-950 border border-orange-300">
              IN PROGRESS
            </span>
          );
        }
        if (r.status === 'completed') {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-black border border-gray-300">
              COMPLETED
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-800 border border-gray-200">
            SCHEDULED
          </span>
        );
      },
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout theme="sample">
        <div className="text-black">
          <PageHeader
            title="Admin Control Center"
            description="Real-time plant metrics, production overview, and ERP operational status"
            breadcrumbs={[{ label: 'Admin Dashboard' }]}
            primaryAction={{
              label: 'Log New Batch',
              icon: <Plus className="w-4 h-4 text-black" />,
              variant: 'orange',
              className: 'bg-orange-500 hover:bg-gray-200 text-black font-bold border border-orange-600/30 transition-colors',
              onClick: () => setIsModalOpen(true),
            }}
            secondaryActions={[
              {
                label: 'Export ERP Report',
                icon: <Download className="w-4 h-4 text-black" />,
                variant: 'outline',
                className: 'bg-white hover:bg-gray-100 text-black font-medium border border-gray-300 transition-colors',
                onClick: () => alert('Generating ERP Summary Report...'),
              },
            ]}
          />

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-xl border border-gray-200 bg-white border-l-4 border-l-orange-500 shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Today&apos;s Production</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    48,500 <span className="text-xs font-medium text-gray-600">Liters</span>
                  </h3>
                  <p className="text-xs text-orange-700 font-bold mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs yesterday
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <Factory className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white border-l-4 border-l-black shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Finished Stock</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    14,250 <span className="text-xs font-medium text-gray-600">Jars</span>
                  </h3>
                  <p className="text-xs text-black font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" /> Stock level optimal
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 text-black border border-gray-300">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white border-l-4 border-l-orange-600 shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Daily Sales Revenue</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">{formatCurrency(184500)}</h3>
                  <p className="text-xs text-orange-700 font-bold mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> +8.5% this week
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white border-l-4 border-l-gray-600 shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Staff</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">42 / 45</h3>
                  <p className="text-xs text-gray-700 font-medium mt-1">Shift 1 active</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 text-gray-800 border border-gray-300">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                  <div>
                    <h3 className="text-base font-bold text-black tracking-tight">Active Production Batches</h3>
                    <p className="text-xs text-gray-700 mt-0.5">Live telemetry from plant filling lines</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-950 border border-orange-300">
                    <Clock className="w-3 h-3 text-orange-700" />
                    Realtime
                  </span>
                </div>
                <div className="p-0">
                  <Table columns={productionColumns} data={MOCK_BATCHES} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-black">Raw Water Reserve</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-black border border-gray-300">
                      92% Capacity
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">Inflow steady at 120 LPM from Borewell #1 & #2</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-black">UV & RO Filtration</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-950 border border-orange-300">
                      Purity 38 PPM
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">Conductivity and pH within certified standards</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-black">Dispatch Queue</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-black border border-gray-300">
                      6 Pending
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">Agency vehicle loading at Bay 1 & Bay 2</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl bg-white shadow-xs p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-base font-bold text-black">Plant Operational Alerts</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-orange-50/80 border border-orange-200 flex items-start gap-3 hover:bg-gray-100 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-orange-950">RO Membrane Filter Cleaning</p>
                      <p className="text-[11px] text-gray-700 mt-0.5">Scheduled for Line 2 at 06:00 PM</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-100 border border-gray-300 flex items-start gap-3 hover:bg-gray-200 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-black mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-black">Raw Water Tank 3 Level Low</p>
                      <p className="text-[11px] text-gray-700 mt-0.5">Capacity at 18%. Borewell pump activated.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-start gap-3 hover:bg-gray-100 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-black">Quality Lab Clearance Passed</p>
                      <p className="text-[11px] text-gray-700 mt-0.5">Batch BATCH-089 purity TDS: 42 ppm</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl bg-white shadow-xs p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-4">
                  <ShieldCheck className="w-5 h-5 text-black" />
                  <h3 className="text-base font-bold text-black">Plant Security & Compliance</h3>
                </div>
                <div className="text-xs text-gray-700 space-y-2.5">
                  <p className="flex justify-between items-center">
                    <span>• ISO 22000 Water Safety:</span>
                    <strong className="text-black bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-bold">
                      Compliant
                    </strong>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>• BIS License Certification:</span>
                    <strong className="text-black font-bold">Active (CM/L-1234)</strong>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>• Daily Water Testing Log:</span>
                    <strong className="text-orange-700 font-bold">Verified</strong>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>• Plant Health & Safety:</span>
                    <strong className="text-black font-bold">100% Passed</strong>
                  </p>
                </div>
              </div>

              {/* Notifications */}
              <NotificationsPanel maxItems={4} />
            </div>
          </div>

          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Create Production Batch"
            description="Log a new filling line batch into the ERP system"
            footer={
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-white text-black border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  variant="orange"
                  onClick={() => {
                    setIsModalOpen(false);
                    alert('Batch created!');
                  }}
                  className="bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30 transition-colors"
                >
                  Submit Batch
                </Button>
              </>
            }
          >
            <div className="space-y-4">
              <Input
                label="Batch Number"
                value={newBatchNo}
                onChange={(e) => setNewBatchNo(e.target.value)}
                className="bg-white text-black border-gray-300 hover:border-gray-400 focus:border-orange-500 focus:ring-orange-200"
              />
              <Select
                label="Product Item"
                options={[
                  { label: '20 Litre Water Jar', value: 'jar20' },
                  { label: '1 Litre Packaged Bottle (12 Pcs)', value: 'b1l' },
                  { label: '500ml Bottled Water (24 Pcs)', value: 'b500' },
                ]}
                className="bg-white text-black border-gray-300 hover:border-gray-400 focus:border-orange-500 focus:ring-orange-200"
              />
              <Input
                label="Target Output Quantity"
                type="number"
                placeholder="e.g. 2500"
                className="bg-white text-black border-gray-300 hover:border-gray-400 focus:border-orange-500 focus:ring-orange-200"
              />
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}