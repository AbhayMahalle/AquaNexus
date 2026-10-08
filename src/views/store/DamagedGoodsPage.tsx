'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { apiRequest, showToast } from '@/lib/api';
import {
  AlertOctagon,
  Search,
  Plus,
  FilterX,
  Package,
  Clock,
  Eye,
  CheckCircle2,
  Trash2,
  Edit2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export interface DamagedItemRecord {
  id: string;
  incidentNumber: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  damageReason: string;
  damageType: 'cracked_jar' | 'defective_cap' | 'broken_preform' | 'chemical_expired' | 'transit_loss';
  date: string;
  reportedBy: string;
  status: 'REPORTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'DISPOSED';
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
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Status update states
  const [updateStatus, setUpdateStatus] = useState<DamagedItemRecord['status']>('UNDER_REVIEW');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Report Form states
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [formIncidentNo, setFormIncidentNo] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formType, setFormType] = useState<DamagedItemRecord['damageType']>('cracked_jar');
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API state
  const [damagedRecords, setDamagedRecords] = useState<DamagedItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Load products list from real database
  useEffect(() => {
    async function loadProducts() {
      const res = await apiRequest<any>('/api/products?limit=100');
      if (res.ok && res.data) {
        const list = res.data.products || (Array.isArray(res.data) ? res.data : []);
        setProducts(list);
        if (list.length > 0) {
          setSelectedProductId(list[0].id);
        }
      }
    }
    loadProducts();
  }, []);

  // Load damaged records from backend
  const loadDamagedRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.append('transactionType', 'DAMAGED');
      q.append('page', String(currentPage));
      q.append('limit', '10');
      const res = await apiRequest<any>(`/api/stock-transactions?${q.toString()}`);
      if (res.ok && res.data) {
        const list = res.data.transactions || (Array.isArray(res.data) ? res.data : []);
        const mapped: DamagedItemRecord[] = list.map((tx: any) => {
          let damageType: DamagedItemRecord['damageType'] = 'cracked_jar';
          const ref = (tx.referenceType || '').toLowerCase();
          const rem = (tx.remarks || '').toLowerCase();
          if (ref.includes('preform') || rem.includes('preform')) damageType = 'broken_preform';
          else if (ref.includes('cap') || rem.includes('cap')) damageType = 'defective_cap';
          else if (ref.includes('chemical') || rem.includes('chemical') || rem.includes('expired')) damageType = 'chemical_expired';
          else if (ref.includes('transit') || rem.includes('transit') || rem.includes('transport')) damageType = 'transit_loss';
          else damageType = 'cracked_jar';

          const rawStatus = (tx.status || 'REPORTED').toUpperCase().replace(/[-\s]/g, '_');
          const validStatuses = ['REPORTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'DISPOSED'];
          const normStatus = validStatuses.includes(rawStatus) ? rawStatus : 'REPORTED';

          return {
            id: tx.id,
            incidentNumber: tx.referenceId || `DMG-${tx.id.slice(0, 8).toUpperCase()}`,
            productName: tx.product?.name || 'Damaged Product',
            sku: tx.product?.sku || '--',
            quantity: Number(tx.quantity),
            unit: tx.product?.unit || 'Units',
            damageReason: tx.remarks || 'Stock write-off',
            damageType,
            date: new Date(tx.createdAt).toLocaleDateString(),
            reportedBy: tx.creator ? `${tx.creator.firstName || ''} ${tx.creator.lastName || ''}`.trim() : 'Store Staff',
            status: normStatus as DamagedItemRecord['status'],
            notes: tx.remarks || '',
          };
        });

        setDamagedRecords(mapped);
        setTotalItems(res.data.pagination?.total || mapped.length);
        setTotalPages(res.data.pagination?.totalPages || Math.ceil(mapped.length / 10) || 1);
      }
    } catch (err) {
      console.error('Failed to load damaged records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadDamagedRecords();
  }, [loadDamagedRecords]);

  // Open Status Update Modal
  const handleOpenStatusModal = (record: DamagedItemRecord) => {
    setSelectedDamage(record);
    setUpdateStatus(record.status);
    setUpdateRemarks(record.notes || '');
    setIsStatusModalOpen(true);
  };

  // Submit Status Update
  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDamage) return;

    setIsUpdatingStatus(true);
    try {
      const res = await apiRequest<any>(`/api/stock-transactions/${selectedDamage.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: updateStatus,
          remarks: updateRemarks.trim() || undefined,
        }),
      });

      if (res.ok) {
        showToast(
          updateStatus === 'REJECTED'
            ? 'Damage claim rejected: stock has been safely restored to inventory.'
            : `Damaged goods status updated to ${updateStatus} successfully!`,
          'success'
        );
        setIsStatusModalOpen(false);
        setSelectedDamage(null);
        await loadDamagedRecords();
      } else {
        showToast(res.error || 'Failed to update damaged item status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating damaged goods status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit Damaged Entry
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !formQuantity) {
      showToast('Please select a product and enter quantity', 'error');
      return;
    }

    const qty = parseInt(formQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('Quantity must be a positive integer greater than 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/stock-transactions', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductId,
          transactionType: 'DAMAGED',
          quantity: qty,
          referenceType: formType,
          status: 'REPORTED',
          referenceId: formIncidentNo.trim() || `DMG-${Date.now().toString().slice(-6)}`,
          remarks: `${formReason || 'Physical damage detected'}. Notes: ${formNotes}`,
        }),
      });

      if (res.ok) {
        showToast('Damaged stock write-off reported successfully! Inventory decremented.', 'success');
        setIsEntryModalOpen(false);
        setFormIncidentNo('');
        setFormQuantity('');
        setFormReason('');
        setFormNotes('');
        await loadDamagedRecords();
      } else {
        showToast(res.error || 'Failed to record damaged stock', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error reporting damaged stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return damagedRecords.filter((r) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesInc = r.incidentNumber?.toLowerCase().includes(query);
        const matchesProd = r.productName?.toLowerCase().includes(query);
        const matchesSku = r.sku?.toLowerCase().includes(query);
        const matchesReason = r.damageReason?.toLowerCase().includes(query);
        const matchesReporter = r.reportedBy?.toLowerCase().includes(query);

        if (!matchesInc && !matchesProd && !matchesSku && !matchesReason && !matchesReporter) {
          return false;
        }
      }

      if (typeFilter !== 'all' && r.damageType !== typeFilter) {
        return false;
      }

      if (statusFilter !== 'all') {
        if (r.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [damagedRecords, searchQuery, typeFilter, statusFilter]);

  const columns: Column<DamagedItemRecord>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{r.date}</span>
        </div>
      ),
    },
    {
      key: 'incidentNumber',
      header: 'Incident / Ref #',
      render: (r) => <span className="font-mono font-bold text-xs text-[#DC2626]">{r.incidentNumber}</span>,
    },
    {
      key: 'productName',
      header: 'Product / Material',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.productName}</span>
          {r.sku && <span className="text-[11px] font-mono text-[#64748B]">SKU: {r.sku}</span>}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Damaged Qty',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#DC2626]">
          {r.quantity} {r.unit}
        </span>
      ),
    },
    {
      key: 'reportedBy',
      header: 'Reported By',
      render: (r) => <span className="text-xs text-[#172033] font-medium">{r.reportedBy}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusMap: Record<string, { variant: 'danger' | 'warning' | 'neutral' | 'success'; label: string }> = {
          REPORTED: { variant: 'neutral', label: 'REPORTED' },
          UNDER_REVIEW: { variant: 'warning', label: 'UNDER REVIEW' },
          APPROVED: { variant: 'danger', label: 'APPROVED LOSS' },
          DISPOSED: { variant: 'danger', label: 'DISPOSED' },
          REJECTED: { variant: 'success', label: 'CLAIM REJECTED' },
        };
        const config = statusMap[r.status] || { variant: 'neutral', label: r.status };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenStatusModal(r)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Update Status
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDamage(r)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Damaged & Scrap Stock Write-offs"
          description="Log damaged bottles, cracked jars, defective preforms, and expired chemicals for review and scrap disposal."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Damaged Goods' }
          ]}
          secondaryActions={[
            {
              label: 'Manage Products',
              href: '/store/products',
              icon: <Package className="w-4 h-4" />,
            },
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
                  leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />}
                />
              </div>

              <div>
                <Select
                  label="Filter by Classification"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={[
                    { label: 'All Damage Classifications', value: 'all' },
                    { label: 'Cracked / Leaking 20L Jars', value: 'cracked_jar' },
                    { label: 'Deformed / Broken Preforms', value: 'broken_preform' },
                    { label: 'Defective Caps & Closures', value: 'defective_cap' },
                    { label: 'Expired Water Treatment Chemical', value: 'chemical_expired' },
                    { label: 'Transit / Loading Impact Damage', value: 'transit_loss' },
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Filter by Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Reported', value: 'REPORTED' },
                    { label: 'Under Review', value: 'UNDER_REVIEW' },
                    { label: 'Approved Write-off', value: 'APPROVED' },
                    { label: 'Disposed / Scrapped', value: 'DISPOSED' },
                    { label: 'Claim Rejected', value: 'REJECTED' },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Showing <strong className="text-[#172033]">{filteredRecords.length}</strong> incident records
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                leftIcon={<FilterX className="w-3.5 h-3.5" />}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Damaged Goods Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-[#DC2626]" />
                  <span>Damaged Goods & Loss Log</span>
                </CardTitle>
                <CardDescription>
                  Tracking write-offs, review status, and disposal stages for defective store assets.
                </CardDescription>
              </div>

              <Badge variant="danger" size="sm">
                Loss Tracking
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={filteredRecords}
              loading={isLoading}
              emptyText="No damaged item records found"
              emptyDescription="No damage records match your filter criteria. Click 'Report Damaged Items' to log defective stock."
            />
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#64748B]">
                  Page {currentPage} of {totalPages}
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Report Damaged Stock */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2 text-[#DC2626]">
              <AlertOctagon className="w-5 h-5 text-[#DC2626]" />
              <span>Report Damaged Stock / Material</span>
            </div>
          }
          description="Log damaged bottles, cracked jars, or scrap material for manager review and write-off."
          size="lg"
        >
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Product / Material"
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} (${p.sku})`,
                  value: p.id,
                }))}
              />

              <Input
                label="Quantity Damaged"
                required
                type="number"
                min="1"
                placeholder="0"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Damage Classification"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                options={[
                  { label: 'Cracked / Leaking 20L Jar', value: 'cracked_jar' },
                  { label: 'Deformed / Broken Preform', value: 'broken_preform' },
                  { label: 'Defective Cap / Closure', value: 'defective_cap' },
                  { label: 'Expired Water Treatment Chemical', value: 'chemical_expired' },
                  { label: 'Transit / Handling Impact Damage', value: 'transit_loss' },
                ]}
              />

              <Input
                label="Incident / Batch Reference #"
                placeholder="e.g. INC-2026-081"
                value={formIncidentNo}
                onChange={(e) => setFormIncidentNo(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Specific Reason / Root Cause"
                required
                placeholder="e.g. Hairline crack near neck detected during pre-fill inspection"
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Additional Investigation Notes"
                placeholder="e.g. Segregated into scrap bin #2 awaiting disposal"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                type="submit"
                disabled={isSubmitting}
                leftIcon={<AlertOctagon className="w-4 h-4" />}
              >
                {isSubmitting ? 'Recording...' : 'Report Damage'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Update Status */}
        {selectedDamage && (
          <Modal
            isOpen={isStatusModalOpen}
            onClose={() => {
              setIsStatusModalOpen(false);
              setSelectedDamage(null);
            }}
            title={
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#0F4C81]" />
                <span>Update Damaged Status: {selectedDamage.incidentNumber}</span>
              </div>
            }
            description="Manage damage incident workflow. If rejected, previously written-off stock will be restored."
            size="md"
          >
            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Material:</span>
                  <strong className="text-[#172033]">{selectedDamage.productName} ({selectedDamage.sku})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Quantity:</span>
                  <strong className="font-mono text-[#DC2626]">{selectedDamage.quantity} {selectedDamage.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Current Status:</span>
                  <Badge variant="secondary" size="sm">{selectedDamage.status}</Badge>
                </div>
              </div>

              <div>
                <Select
                  label="Workflow Stage / Status"
                  required
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  options={[
                    { label: 'REPORTED - Newly reported incident', value: 'REPORTED' },
                    { label: 'UNDER_REVIEW - QA / Store Manager investigating cause', value: 'UNDER_REVIEW' },
                    { label: 'APPROVED - Write-off loss confirmed', value: 'APPROVED' },
                    { label: 'DISPOSED - Physical scrap disposal completed', value: 'DISPOSED' },
                    { label: 'REJECTED - Damage claim rejected (Restores stock to inventory)', value: 'REJECTED' },
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Manager Remarks & Disposal Notes"
                  placeholder="e.g. Approved scrap write-off. Material sent to recycling facility."
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                />
              </div>

              {updateStatus === 'REJECTED' && (
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                  <span>
                    Setting status to REJECTED will safely reverse the write-off and restore {selectedDamage.quantity} {selectedDamage.unit} back to active inventory.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedDamage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isUpdatingStatus}
                  leftIcon={<Edit2 className="w-4 h-4" />}
                >
                  {isUpdatingStatus ? 'Saving...' : 'Update Status'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal: View Details */}
        {selectedDamage && !isStatusModalOpen && (
          <Modal
            isOpen={!!selectedDamage}
            onClose={() => setSelectedDamage(null)}
            title={`Damage Incident: ${selectedDamage.incidentNumber}`}
            description="Defective material report record."
            footer={
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenStatusModal(selectedDamage)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Change Status
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedDamage(null)}>
                  Close
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block">Material</span>
                  <span className="font-bold text-[#172033]">{selectedDamage.productName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Quantity</span>
                  <span className="font-mono font-bold text-[#DC2626]">{selectedDamage.quantity} {selectedDamage.unit}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Status</span>
                  <Badge variant="primary" size="sm">{selectedDamage.status}</Badge>
                </div>
                <div>
                  <span className="text-[#64748B] block">Date</span>
                  <span>{selectedDamage.date}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Reported By</span>
                  <span>{selectedDamage.reportedBy}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Classification</span>
                  <span className="capitalize">{selectedDamage.damageType.replace('_', ' ')}</span>
                </div>
              </div>

              {selectedDamage.damageReason && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block mb-1">Reason & Remarks:</span>
                  <p className="text-[#172033]">{selectedDamage.damageReason}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
