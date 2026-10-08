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
  FileCheck2,
  Search,
  Plus,
  ArrowRight,
  FilterX,
  Package,
  Clock,
  Eye,
  CheckCircle2,
  Factory,
  Edit2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export interface GoodsReceivedNote {
  id: string;
  grnNumber: string;
  sourceReference: string;
  sourceType: 'production' | 'vendor';
  materialName: string;
  sku?: string;
  quantityReceived: number;
  unit: string;
  date: string;
  receivedBy: string;
  status: 'PENDING' | 'RECEIVED' | 'PARTIALLY_RECEIVED' | 'REJECTED';
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
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Status update form states
  const [updateStatus, setUpdateStatus] = useState<'PENDING' | 'RECEIVED' | 'PARTIALLY_RECEIVED' | 'REJECTED'>('RECEIVED');
  const [updateQuantity, setUpdateQuantity] = useState('');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Entry Form states
  const [productions, setProductions] = useState<any[]>([]);
  const [selectedProductionId, setSelectedProductionId] = useState('');
  const [formGrnNumber, setFormGrnNumber] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formStatus, setFormStatus] = useState<'RECEIVED' | 'PENDING'>('RECEIVED');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API state
  const [grnRecords, setGrnRecords] = useState<GoodsReceivedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load productions for receipt
  const loadProductions = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/api/production?limit=100');
      if (res.ok && res.data) {
        const list = res.data.productions || (Array.isArray(res.data) ? res.data : []);
        setProductions(list);
        if (list.length > 0) {
          setSelectedProductionId((prev) => (prev && list.some((p: any) => p.id === prev) ? prev : list[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load productions:', err);
    }
  }, []);

  useEffect(() => {
    loadProductions();
  }, [loadProductions]);

  // Load GRN records from backend
  const loadGrnRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.append('page', '1');
      q.append('limit', '200');

      const res = await apiRequest<any>(`/api/goods-received?${q.toString()}`);
      if (res.ok && res.data) {
        const list = res.data.goodsReceived || (Array.isArray(res.data) ? res.data : []);
        const mapped: GoodsReceivedNote[] = list.map((gr: any) => {
          let rawStatus = (gr.status || 'RECEIVED').toUpperCase().replace(/[-\s]/g, '_');
          if (rawStatus === 'VERIFIED') rawStatus = 'RECEIVED';
          if (rawStatus === 'PENDING_INSPECTION') rawStatus = 'PENDING';
          if (rawStatus === 'PARTIAL') rawStatus = 'PARTIALLY_RECEIVED';

          const validStatuses = ['PENDING', 'RECEIVED', 'PARTIALLY_RECEIVED', 'REJECTED'];
          const normStatus = validStatuses.includes(rawStatus) ? rawStatus : 'RECEIVED';

          return {
            id: gr.id,
            grnNumber: gr.grnNumber || '',
            sourceReference: gr.production?.productionNumber || gr.production?.batchNumber || (gr.sourceReference || 'Prod Batch'),
            sourceType: gr.sourceType || (gr.productionId || gr.production ? 'production' : 'vendor'),
            materialName: gr.product?.name || gr.materialName || 'Finished Goods',
            sku: gr.product?.sku || gr.sku || '--',
            quantityReceived: gr.quantity !== undefined ? Number(gr.quantity) : Number(gr.quantityReceived || 0),
            unit: gr.product?.unit || gr.unit || 'Units',
            date: new Date(gr.receivedDate || gr.createdAt || Date.now()).toLocaleDateString(),
            receivedBy: gr.receiver ? `${gr.receiver.firstName || ''} ${gr.receiver.lastName || ''}`.trim() : (gr.receivedBy || 'Store Staff'),
            status: normStatus as GoodsReceivedNote['status'],
            notes: gr.remarks || gr.notes || '',
          };
        });

        setGrnRecords(mapped);
      }
    } catch (err) {
      console.error('Failed to load GRN records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGrnRecords();
  }, [loadGrnRecords]);

  // Open Status Update Modal
  const handleOpenStatusModal = (grn: GoodsReceivedNote) => {
    setSelectedGrn(grn);
    setUpdateStatus(grn.status);
    setUpdateQuantity(String(grn.quantityReceived));
    setUpdateRemarks(grn.notes || '');
    setIsStatusModalOpen(true);
  };

  // Submit Status Update
  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGrn) return;

    const qty = parseInt(updateQuantity, 10);
    if (isNaN(qty) || qty < 0) {
      showToast('Quantity must be a non-negative integer', 'error');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await apiRequest<any>(`/api/goods-received/${selectedGrn.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: updateStatus,
          receivedQuantity: qty,
          remarks: updateRemarks.trim() || undefined,
        }),
      });

      if (res.ok) {
        showToast(`GRN status updated to ${updateStatus} successfully! Inventory synchronized.`, 'success');
        setIsStatusModalOpen(false);
        setSelectedGrn(null);
        await loadGrnRecords();
      } else {
        showToast(res.error || 'Failed to update GRN status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating GRN status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit New GRN Note
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = productions.find((p) => p.id === selectedProductionId);
    if (!selectedProductionId || !prod) {
      showToast('Please select a valid production batch', 'error');
      return;
    }

    const qty = parseInt(formQuantity, 10);
    if (!formQuantity || isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid received quantity greater than 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/goods-received', {
        method: 'POST',
        body: JSON.stringify({
          productionId: selectedProductionId,
          productId: prod.productId || prod.product?.id,
          quantity: qty,
          receivedDate: new Date().toISOString(),
          status: formStatus,
          grnNumber: formGrnNumber.trim() || undefined,
          remarks: formNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        showToast(
          formStatus === 'RECEIVED'
            ? 'GRN created and store inventory updated successfully!'
            : 'GRN created in PENDING status. Stock will update upon verification.',
          'success'
        );
        setIsEntryModalOpen(false);
        setFormGrnNumber('');
        setFormQuantity('');
        setFormNotes('');
        setFormStatus('RECEIVED');
        await loadGrnRecords();
      } else {
        showToast(res.error || 'Failed to record Goods Received Note', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating Goods Received Note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return grnRecords.filter((record) => {
      if (searchQuery.trim()) {
        const term = searchQuery.trim().toLowerCase();
        const matchesGrn = record.grnNumber?.toLowerCase().includes(term);
        const matchesRef = record.sourceReference?.toLowerCase().includes(term);
        const matchesMaterial = record.materialName?.toLowerCase().includes(term);
        const matchesSku = record.sku?.toLowerCase().includes(term);
        const matchesRemarks = record.notes?.toLowerCase().includes(term);

        if (!matchesGrn && !matchesRef && !matchesMaterial && !matchesSku && !matchesRemarks) {
          return false;
        }
      }

      if (sourceFilter !== 'all') {
        const recordSource = (record.sourceType || '').toLowerCase();
        if (recordSource !== sourceFilter.toLowerCase()) {
          return false;
        }
      }

      if (statusFilter !== 'all') {
        if (record.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [grnRecords, searchQuery, sourceFilter, statusFilter]);

  const itemsPerPage = 10;
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const columns: Column<GoodsReceivedNote>[] = [
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
      key: 'grnNumber',
      header: 'GRN Number',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.grnNumber}</span>,
    },
    {
      key: 'sourceReference',
      header: 'Batch Reference',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-semibold text-[#172033]">{r.sourceReference}</span>
          <Badge variant={r.sourceType === 'production' ? 'primary' : 'neutral'} size="sm">
            {r.sourceType === 'production' ? 'PLANT BATCH' : 'VENDOR'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'materialName',
      header: 'Product / Material',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.materialName}</span>
          {r.sku && <span className="text-[11px] font-mono text-[#64748B]">SKU: {r.sku}</span>}
        </div>
      ),
    },
    {
      key: 'quantityReceived',
      header: 'Quantity',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantityReceived} {r.unit}
        </span>
      ),
    },
    {
      key: 'receivedBy',
      header: 'Received By',
      render: (r) => <span className="text-xs text-[#172033] font-medium">{r.receivedBy}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
          RECEIVED: { variant: 'success', label: 'RECEIVED' },
          PENDING: { variant: 'warning', label: 'PENDING QA' },
          PARTIALLY_RECEIVED: { variant: 'info', label: 'PARTIAL' },
          REJECTED: { variant: 'danger', label: 'REJECTED' },
        };
        const config = statusMap[r.status] || { variant: 'info', label: r.status };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
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
            onClick={() => setSelectedGrn(r)}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
          >
            Details
          </Button>
        </div>
      ),
    },
  ];

  const selectedProd = productions.find((p) => p.id === selectedProductionId);

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Goods Received Notes (GRN)"
          description="Acknowledge incoming production output batches and incoming raw shipments with inventory synchronization."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Goods Received' }
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
            label: 'Receive Plant Goods (GRN)',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setIsEntryModalOpen(true),
          }}
        />

        {/* Filter Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Search GRN Ledger"
                  placeholder="Search by GRN#, Production Batch, Product, or SKU..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />}
                />
              </div>

              <div>
                <Select
                  label="Filter by Source"
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Source Types', value: 'all' },
                    { label: 'Production Plant Batch', value: 'production' },
                    { label: 'Vendor Consignment', value: 'vendor' },
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Filter by Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Received & Stocked', value: 'RECEIVED' },
                    { label: 'Pending QA Inspection', value: 'PENDING' },
                    { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
                    { label: 'Rejected / Quarantine', value: 'REJECTED' },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Showing <strong className="text-[#172033]">{filteredRecords.length}</strong> Goods Received Notes
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSourceFilter('all');
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

        {/* GRN Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-[#0F4C81]" />
                  <span>Goods Received Ledger</span>
                </CardTitle>
                <CardDescription>
                  Production receipts and incoming material inspection records synchronized with Postgres inventory.
                </CardDescription>
              </div>

              <Badge variant="primary" size="sm">
                Live GRN Ledger
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={paginatedRecords}
              loading={isLoading}
              emptyText="No Goods Received records found"
              emptyDescription="No GRN entries match your current filters. Click 'Receive Plant Goods' to log an incoming production batch."
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

        {/* Modal: Generate New GRN */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#0F4C81]" />
              <span>Receive Production Batch (New GRN)</span>
            </div>
          }
          description="Log completed finished goods from the plant line into store warehouse inventory."
          size="lg"
        >
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Production Batch Reference"
                required
                value={selectedProductionId}
                onChange={(e) => {
                  setSelectedProductionId(e.target.value);
                  const p = productions.find((x) => x.id === e.target.value);
                  if (p) setFormQuantity(String(p.quantity || ''));
                }}
                options={productions.map((p) => ({
                  label: `${p.productionNumber || p.batchNumber} - ${p.product?.name || 'Production Batch'} (Qty: ${p.quantity})`,
                  value: p.id,
                }))}
              />

              <Input
                label="GRN Number (Auto-assigned if blank)"
                placeholder="e.g. GRN-2026-0042"
                value={formGrnNumber}
                onChange={(e) => setFormGrnNumber(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`Quantity Received (${selectedProd?.product?.unit || 'Units'})`}
                required
                type="number"
                min="1"
                placeholder={selectedProd ? `e.g. ${selectedProd.quantity}` : '0'}
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
              />

              <Select
                label="Initial Receipt Status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                options={[
                  { label: 'RECEIVED (Update Inventory Immediately)', value: 'RECEIVED' },
                  { label: 'PENDING (Hold for QA Inspection)', value: 'PENDING' },
                ]}
              />
            </div>

            {selectedProd && (
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#64748B] block">Batch Product:</span>
                  <span className="font-bold text-[#172033]">{selectedProd?.product?.name || 'Linked Product'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Unit:</span>
                  <span className="font-mono font-bold text-[#0F4C81]">{selectedProd?.product?.unit || 'Units'}</span>
                </div>
              </div>
            )}

            <div>
              <Input
                label="Quality Check Notes / Remarks"
                placeholder="e.g. Seals intact, visual purity verified, batch lot #904"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
                leftIcon={<FileCheck2 className="w-4 h-4" />}
              >
                {isSubmitting ? 'Saving...' : 'Generate GRN'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Update GRN Status */}
        {selectedGrn && (
          <Modal
            isOpen={isStatusModalOpen}
            onClose={() => {
              setIsStatusModalOpen(false);
              setSelectedGrn(null);
            }}
            title={
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#0F4C81]" />
                <span>Update GRN Status: {selectedGrn.grnNumber}</span>
              </div>
            }
            description="Manage receipt inspection status. Inventory will be updated automatically and safely without duplicates."
            size="md"
          >
            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Product:</span>
                  <strong className="text-[#172033]">{selectedGrn.materialName} ({selectedGrn.sku})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Batch Ref:</span>
                  <strong className="font-mono text-[#172033]">{selectedGrn.sourceReference}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Current Status:</span>
                  <Badge variant="secondary" size="sm">{selectedGrn.status}</Badge>
                </div>
              </div>

              <div>
                <Select
                  label="Update Status"
                  required
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  options={[
                    { label: 'PENDING - Keep in QA quarantine holding', value: 'PENDING' },
                    { label: 'RECEIVED - Verify and add stock to inventory', value: 'RECEIVED' },
                    { label: 'PARTIALLY_RECEIVED - Partial batch accepted', value: 'PARTIALLY_RECEIVED' },
                    { label: 'REJECTED - Reject batch and quarantine', value: 'REJECTED' },
                  ].filter(opt => {
                    if (!selectedGrn) return true;
                    // Current status is always an option so it doesn't blank out
                    if (opt.value === selectedGrn.status) return true;
                    const validTransitions: Record<string, string[]> = {
                      'PENDING': ['PARTIALLY_RECEIVED', 'RECEIVED', 'REJECTED'],
                      'PARTIALLY_RECEIVED': ['RECEIVED', 'REJECTED'],
                      'RECEIVED': [],
                      'REJECTED': []
                    };
                    return validTransitions[selectedGrn.status]?.includes(opt.value);
                  })}
                />
              </div>

              <div>
                <Input
                  label={`Quantity Accepted (${selectedGrn.unit})`}
                  required
                  type="number"
                  min="0"
                  value={updateQuantity}
                  onChange={(e) => setUpdateQuantity(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Inspector Remarks & Findings"
                  placeholder="e.g. Passed microbiology test, approved for store shelving"
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                />
              </div>

              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>
                  The system prevents duplicate stock increments. Re-saving this GRN will not double-count inventory.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedGrn(null);
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
        {selectedGrn && !isStatusModalOpen && (
          <Modal
            isOpen={!!selectedGrn}
            onClose={() => setSelectedGrn(null)}
            title={`GRN Details: ${selectedGrn.grnNumber}`}
            description="Goods Received Note verification record."
            footer={
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenStatusModal(selectedGrn)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Change Status
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedGrn(null)}>
                  Close
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block">Batch Reference</span>
                  <span className="font-bold text-[#172033]">{selectedGrn.sourceReference}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Material</span>
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
                <div>
                  <span className="text-[#64748B] block">Date</span>
                  <span>{selectedGrn.date}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Status</span>
                  <Badge variant="primary" size="sm">{selectedGrn.status}</Badge>
                </div>
              </div>

              {selectedGrn.notes && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block mb-1">Remarks & QA Notes:</span>
                  <p className="text-[#172033]">{selectedGrn.notes}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
