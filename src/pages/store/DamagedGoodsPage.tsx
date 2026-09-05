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
  AlertOctagon,
  Search,
  Plus,
  FilterX,
  Package,
  Clock,
  Eye,
  CheckCircle2,
  Trash2
} from 'lucide-react';

export interface DamagedItemRecord {
  id: string;
  incidentNumber: string;
  productName: string;
  sku?: string;
  quantity: string | number;
  unit: string;
  damageReason: string;
  damageType: 'cracked_jar' | 'defective_cap' | 'broken_preform' | 'chemical_expired' | 'transit_loss';
  date: string;
  reportedBy: string;
  status: 'approved_writeoff' | 'pending_review' | 'disposed' | 'rejected';
  notes?: string;
}

export default function DamagedGoodsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState<DamagedItemRecord | null>(null);

  // Form states (API-ready)
  const [formIncidentNo, setFormIncidentNo] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formType, setFormType] = useState<'cracked_jar' | 'defective_cap' | 'broken_preform' | 'chemical_expired' | 'transit_loss'>('cracked_jar');
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // API-ready state
  const damagedRecords: DamagedItemRecord[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

  const typeOptions = [
    { label: 'All Damage Classifications', value: 'all' },
    { label: 'Cracked / Leaking 20L Jars', value: 'cracked_jar' },
    { label: 'Deformed / Broken Preforms', value: 'broken_preform' },
    { label: 'Defective Caps & Closures', value: 'defective_cap' },
    { label: 'Expired Water Treatment Chemical', value: 'chemical_expired' },
    { label: 'Transit / Loading Impact Damage', value: 'transit_loss' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Approved Write-off', value: 'approved_writeoff' },
    { label: 'Pending Store Manager Review', value: 'pending_review' },
    { label: 'Disposed / Scrapped', value: 'disposed' },
    { label: 'Claim Rejected', value: 'rejected' },
  ];

  const columns: Column<DamagedItemRecord>[] = [
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
      key: 'incidentNumber',
      header: 'Incident / Ref #',
      render: (r) => <span className="font-mono font-bold text-xs text-[#DC2626]">{r.incidentNumber}</span>
    },
    {
      key: 'productName',
      header: 'Product / Material',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.productName}</span>
          {r.sku && <span className="text-[11px] font-mono text-[#64748B]">SKU: {r.sku}</span>}
        </div>
      )
    },
    {
      key: 'damageType',
      header: 'Damage Classification',
      render: (r) => {
        const typeLabels: Record<string, string> = {
          cracked_jar: 'Cracked 20L Jar',
          broken_preform: 'Broken Preform',
          defective_cap: 'Defective Cap',
          chemical_expired: 'Chemical Expired',
          transit_loss: 'Transit Loss',
        };
        return <Badge variant="danger" size="sm">{typeLabels[r.damageType] || r.damageType}</Badge>;
      }
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#DC2626]">
          {r.quantity} {r.unit}
        </span>
      )
    },
    {
      key: 'damageReason',
      header: 'Reason / Root Cause',
      render: (r) => <span className="text-xs text-[#172033]">{r.damageReason}</span>
    },
    {
      key: 'reportedBy',
      header: 'Reported By',
      render: (r) => <span className="text-xs text-[#64748B]">{r.reportedBy}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusMap: Record<string, { variant: 'danger' | 'warning' | 'neutral' | 'success'; label: string }> = {
          approved_writeoff: { variant: 'warning', label: 'APPROVED LOSS' },
          pending_review: { variant: 'neutral', label: 'UNDER REVIEW' },
          disposed: { variant: 'danger', label: 'DISPOSED' },
          rejected: { variant: 'success', label: 'REJECTED' },
        };
        const config = statusMap[r.status] || { variant: 'neutral', label: r.status };
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
          onClick={() => setSelectedDamage(r)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Details
        </Button>
      )
    }
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setIsEntryModalOpen(false);
      setFormIncidentNo('');
      setFormProduct('');
      setFormQuantity('');
      setFormReason('');
      setFormNotes('');
    }, 1200);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Damaged & Scrap Stock Write-offs"
          description="Log damaged bottles, cracked jars, defective preforms, and expired chemicals for write-off and scrap disposal."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Damaged Goods' }
          ]}
          secondaryActions={[
            {
              label: 'Store Inventory',
              href: '/store/inventory',
              icon: <Package className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Report Damaged Items',
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
                  label="Search Damaged Records"
                  placeholder="Search by Incident #, material, or reason..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Damage Type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={typeOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Write-off Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={statusOptions}
                  />
                </div>

                {(searchQuery || typeFilter !== 'all' || statusFilter !== 'all') && (
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

        {/* Damaged Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-[#DC2626]" />
                  <span>Damaged & Scrap Write-off Registry</span>
                </CardTitle>
                <CardDescription>
                  Loss accounting entries tracking physical damage before inventory adjustment approval.
                </CardDescription>
              </div>

              <Badge variant="danger" size="sm">
                Loss Tracking Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={damagedRecords}
              loading={isLoading}
              emptyText="No damaged items recorded"
              emptyDescription="No damage incident reports found. Click 'Report Damaged Items' to log defective jars, preforms, or expired chemicals."
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

        {/* Modal: Report Damaged Items */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-[#DC2626]" />
              <span>Report Damaged Stock Incident</span>
            </div>
          }
          description="Log damaged materials for write-off and audit review."
          size="lg"
        >
          {submittedMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#172033]">Damage Incident Staged</h4>
              <p className="text-xs text-[#64748B]">Payload prepared for manager loss review and inventory write-off API.</p>
            </div>
          ) : (
            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Damage Incident #"
                  required
                  placeholder="e.g. DMG-2026-0012"
                  value={formIncidentNo}
                  onChange={(e) => setFormIncidentNo(e.target.value)}
                />

                <Select
                  label="Damage Classification"
                  required
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as any)}
                  options={[
                    { label: 'Cracked / Leaking 20L Jar', value: 'cracked_jar' },
                    { label: 'Broken / Deformed Preforms', value: 'broken_preform' },
                    { label: 'Defective Caps & Closures', value: 'defective_cap' },
                    { label: 'Expired Chemical Reagent', value: 'chemical_expired' },
                    { label: 'Transit / Handling Impact', value: 'transit_loss' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Product / Material Description"
                  required
                  placeholder="e.g. Filled 20L Water Jar (Bottom Crack)"
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  leftIcon={<Package className="w-4 h-4" />}
                />

                <Input
                  label="Observed Cause / Reason"
                  required
                  placeholder="e.g. Forklift impact during pallet unloading"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Quantity Damaged"
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
                    { label: 'Jars / Bottles', value: 'jars' },
                    { label: 'Pcs (Preforms/Caps)', value: 'pcs' },
                    { label: 'Liters', value: 'liters' },
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Disposal & Loss Assessment Notes"
                  placeholder="e.g. Water drained, jar scrapped into recycling holding bin"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  leftIcon={<Trash2 className="w-4 h-4 text-[#64748B]" />}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="danger" size="sm" type="submit" leftIcon={<AlertOctagon className="w-4 h-4" />}>
                  Submit Damage Report
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal: View Details */}
        {selectedDamage && (
          <Modal
            isOpen={!!selectedDamage}
            onClose={() => setSelectedDamage(null)}
            title={`Incident Details: ${selectedDamage.incidentNumber}`}
            description="Damaged stock audit record."
            footer={
              <Button variant="outline" size="sm" onClick={() => setSelectedDamage(null)}>
                Close
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] block">Product</span>
                  <span className="font-bold text-[#172033]">{selectedDamage.productName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Quantity</span>
                  <span className="font-mono font-bold text-[#DC2626]">{selectedDamage.quantity} {selectedDamage.unit}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Reason</span>
                  <span>{selectedDamage.damageReason}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Reported By</span>
                  <span>{selectedDamage.reportedBy}</span>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
