import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  FileCheck2,
  Search,
  Plus,
  ArrowRight,
  FilterX,
  Package,
  Clock,
  Eye,
  CheckCircle2,
  Factory
} from 'lucide-react';

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  sourceReference: string;
  sourceType: 'production' | 'vendor';
  materialName: string;
  sku?: string;
  quantityReceived: string | number;
  unit: string;
  date: string;
  receivedBy: string;
  status: 'verified' | 'pending_inspection' | 'rejected' | 'partial';
  storageLocation?: string;
  notes?: string;
}

export default function GoodsReceivedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GoodsReceivedNote | null>(null);

  // Form states (API-ready)
  const [formGrnNumber, setFormGrnNumber] = useState('');
  const [formSourceRef, setFormSourceRef] = useState('');
  const [formSourceType, setFormSourceType] = useState<'production' | 'vendor'>('production');
  const [formMaterial, setFormMaterial] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('units');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // API-ready state
  const grnRecords: GoodsReceivedNote[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

  const sourceOptions = [
    { label: 'All Source Types', value: 'all' },
    { label: 'Production Plant Batch', value: 'production' },
    { label: 'Vendor Procurement PO', value: 'vendor' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Verified & Accepted', value: 'verified' },
    { label: 'Pending QA Inspection', value: 'pending_inspection' },
    { label: 'Partial Receipt', value: 'partial' },
    { label: 'Rejected / Quarantine', value: 'rejected' },
  ];

  const columns: Column<GoodsReceivedNote>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{r.date}</span>
        </div>
      )
    },
    {
      key: 'grnNumber',
      header: 'GRN Number',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.grnNumber}</span>
    },
    {
      key: 'sourceReference',
      header: 'Source / Production Ref',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-[#172033]">{r.sourceReference}</span>
          <Badge variant={r.sourceType === 'production' ? 'primary' : 'neutral'} size="sm">
            {r.sourceType === 'production' ? 'PROD BATCH' : 'VENDOR PO'}
          </Badge>
        </div>
      )
    },
    {
      key: 'materialName',
      header: 'Product / Material',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.materialName}</span>
          {r.sku && <span className="text-[11px] font-mono text-[#64748B]">SKU: {r.sku}</span>}
        </div>
      )
    },
    {
      key: 'quantityReceived',
      header: 'Quantity Received',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantityReceived} {r.unit}
        </span>
      )
    },
    {
      key: 'receivedBy',
      header: 'Received By',
      render: (r) => <span className="text-xs text-[#172033] font-medium">{r.receivedBy}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
          verified: { variant: 'success', label: 'VERIFIED' },
          pending_inspection: { variant: 'warning', label: 'PENDING QA' },
          partial: { variant: 'info', label: 'PARTIAL' },
          rejected: { variant: 'danger', label: 'REJECTED' },
        };
        const config = statusMap[r.status] || { variant: 'info', label: r.status };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedGrn(r)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Details
        </Button>
      )
    }
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setSourceFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setIsEntryModalOpen(false);
      setFormGrnNumber('');
      setFormSourceRef('');
      setFormMaterial('');
      setFormQuantity('');
      setFormLocation('');
      setFormNotes('');
    }, 1200);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Goods Received Notes (GRN)"
          description="Acknowledge incoming finished water from production lines and raw material consignments into store inventory."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Goods Received' }
          ]}
          secondaryActions={[
            {
              label: 'Store Inventory',
              href: '/store/inventory',
              icon: <Package className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Generate GRN',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setIsEntryModalOpen(true),
          }}
        />

        {/* Search & Filter Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Search Goods Received"
                  placeholder="Search by GRN #, Production Batch #, or material..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Source Type"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  options={sourceOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Inspection Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={statusOptions}
                  />
                </div>

                {(searchQuery || sourceFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleResetFilters}
                    title="Reset filters"
                    className="shrink-0 text-xs px-2.5"
                  >
                    <FilterX className="w-4 h-4 text-[#64748B]" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GRN Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#0F4C81]" />
                  <span>Goods Received Registry</span>
                </CardTitle>
                <CardDescription>
                  Production handovers (e.g. Bottling runs) and vendor PO deliveries with quality verification status.
                </CardDescription>
              </div>

              <Badge variant="primary" size="sm">
                Production → Store Link
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={grnRecords}
              loading={isLoading}
              emptyText="No Goods Received Notes found"
              emptyDescription="No GRN entries have been created yet. Generate a new GRN when receiving bottled batches from production or materials from suppliers."
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={10}
                onPageChange={(p) => setCurrentPage(p)}
              />
            )}
          </CardContent>
        </Card>

        {/* Modal: Generate GRN */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#0F4C81]" />
              <span>Generate Goods Received Note (GRN)</span>
            </div>
          }
          description="Record material receipt and inspection from production lines or procurement."
          size="lg"
        >
          {submittedMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#172033]">GRN Slip Staged</h4>
              <p className="text-xs text-[#64748B]">Payload prepared for inventory intake and production reference matching.</p>
            </div>
          ) : (
            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GRN Reference #"
                  required
                  placeholder="e.g. GRN-2026-0091"
                  value={formGrnNumber}
                  onChange={(e) => setFormGrnNumber(e.target.value)}
                />

                <Select
                  label="Source Type"
                  required
                  value={formSourceType}
                  onChange={(e) => setFormSourceType(e.target.value as 'production' | 'vendor')}
                  options={[
                    { label: 'Production Line (Finished Goods)', value: 'production' },
                    { label: 'Vendor Procurement (Raw Materials)', value: 'vendor' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={formSourceType === 'production' ? 'Production Batch Reference #' : 'Purchase Order / Challan #'}
                  required
                  placeholder={formSourceType === 'production' ? 'e.g. BATCH-2026-PROD-401' : 'e.g. PO-2026-8812'}
                  value={formSourceRef}
                  onChange={(e) => setFormSourceRef(e.target.value)}
                  leftIcon={<Factory className="w-4 h-4" />}
                />

                <Input
                  label="Product / Material Name"
                  required
                  placeholder="e.g. 20L Filled Water Jars (Finished)"
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  leftIcon={<Package className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Quantity Received"
                  required
                  type="number"
                  placeholder="0"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                />

                <Select
                  label="Unit"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  options={[
                    { label: 'Jars / Bottles', value: 'units' },
                    { label: 'Cartons / Cases', value: 'cases' },
                    { label: 'Pcs (Preforms/Caps)', value: 'pcs' },
                    { label: 'Liters (Chemicals)', value: 'liters' },
                  ]}
                />

                <Input
                  label="Storage Rack / Bin"
                  placeholder="e.g. Bay 2 - Pallet A"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Quality Check Notes / Remarks"
                  placeholder="e.g. Visual seals verified, TDS 45ppm within threshold"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" leftIcon={<FileCheck2 className="w-4 h-4" />}>
                  Acknowledge & Save GRN
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal: View GRN Details */}
        {selectedGrn && (
          <Modal
            isOpen={!!selectedGrn}
            onClose={() => setSelectedGrn(null)}
            title={`GRN Details: ${selectedGrn.grnNumber}`}
            description="Goods Received Note verification record."
            footer={
              <Button variant="outline" size="sm" onClick={() => setSelectedGrn(null)}>
                Close
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] block">Source Reference</span>
                  <span className="font-bold text-[#172033]">{selectedGrn.sourceReference} ({selectedGrn.sourceType.toUpperCase()})</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Material Received</span>
                  <span className="font-bold text-[#172033]">{selectedGrn.materialName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Quantity</span>
                  <span className="font-mono font-bold text-[#172033]">{selectedGrn.quantityReceived} {selectedGrn.unit}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Inspector / Received By</span>
                  <span>{selectedGrn.receivedBy}</span>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
