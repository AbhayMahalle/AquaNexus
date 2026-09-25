'use client';

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

  // Form states
  const [productions, setProductions] = useState<any[]>([]);
  const [selectedProductionId, setSelectedProductionId] = useState('');
  const [formGrnNumber, setFormGrnNumber] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API-ready state
  const [grnRecords, setGrnRecords] = useState<GoodsReceivedNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load productions for receipt
  const loadProductions = React.useCallback(async () => {
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

  React.useEffect(() => {
    loadProductions();
  }, [loadProductions]);

  React.useEffect(() => {
    if (isEntryModalOpen) {
      loadProductions();
    }
  }, [isEntryModalOpen, loadProductions]);

  // Load GRN records
  const loadGrnRecords = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.append('page', '1');
      q.append('limit', '200');

      const res = await apiRequest<any>(`/api/goods-received?${q.toString()}`);
      if (res.ok && res.data) {
        const list = res.data.goodsReceived || (Array.isArray(res.data) ? res.data : []);
        const mapped: GoodsReceivedNote[] = list.map((gr: any) => ({
          id: gr.id,
          grnNumber: gr.grnNumber || '',
          sourceReference: gr.production?.productionNumber || gr.production?.batchNumber || (gr.sourceReference || 'Prod Batch'),
          sourceType: gr.sourceType || (gr.productionId || gr.production ? 'production' : 'vendor'),
          materialName: gr.product?.name || gr.materialName || 'Finished Goods',
          sku: gr.product?.sku || gr.sku || '--',
          quantityReceived: gr.quantity !== undefined ? gr.quantity : (gr.quantityReceived || 0),
          unit: gr.product?.unit || gr.unit || 'Units',
          date: new Date(gr.receivedDate || gr.createdAt || Date.now()).toLocaleDateString(),
          receivedBy: gr.receiver ? `${gr.receiver.firstName || ''} ${gr.receiver.lastName || ''}`.trim() : (gr.receivedBy || 'Store Staff'),
          status: gr.status || 'verified',
          notes: gr.remarks || gr.notes || '',
        }));

        setGrnRecords(mapped);
      }
    } catch (err) {
      console.error('Failed to load GRN records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadGrnRecords();
  }, [loadGrnRecords]);

  // Filter GRN records based on Search, Source Type, and Inspection Status
  const filteredRecords = React.useMemo(() => {
    return grnRecords.filter((record) => {
      // 1. Search filter: matches GRN number, production/reference number, product/material name, SKU
      if (searchQuery.trim()) {
        const term = searchQuery.trim().toLowerCase();
        const matchesGrn = record.grnNumber?.toLowerCase().includes(term);
        const matchesRef = record.sourceReference?.toLowerCase().includes(term);
        const matchesMaterial = record.materialName?.toLowerCase().includes(term);
        const matchesSku = record.sku?.toLowerCase().includes(term);

        if (!matchesGrn && !matchesRef && !matchesMaterial && !matchesSku) {
          return false;
        }
      }

      // 2. Source Type filter
      if (sourceFilter !== 'all') {
        const recordSource = (record.sourceType || '').toLowerCase();
        if (recordSource !== sourceFilter.toLowerCase()) {
          return false;
        }
      }

      // 3. Inspection Status filter
      if (statusFilter !== 'all') {
        const recordStatus = (record.status || '').toLowerCase().replace(/[-\s]/g, '_');
        const filterStatus = statusFilter.toLowerCase().replace(/[-\s]/g, '_');
        if (recordStatus !== filterStatus) {
          return false;
        }
      }

      return true;
    });
  }, [grnRecords, searchQuery, sourceFilter, statusFilter]);

  // Pagination for filtered records
  const itemsPerPage = 10;
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedRecords = React.useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

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
          grnNumber: formGrnNumber.trim() || undefined,
          remarks: formNotes.trim() || undefined,
        }),
      });

      if (res.ok) {
        showToast('Goods Received Note generated and stock updated successfully!', 'success');
        setIsEntryModalOpen(false);
        setFormGrnNumber('');
        setFormQuantity('');
        setFormNotes('');
        await loadGrnRecords();
      } else {
        showToast(res.error || 'Failed to record Goods Received Note', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing goods receipt', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProd = productions.find((p) => p.id === selectedProductionId);
  const productionOptions =
    productions.length > 0
      ? productions.map((p) => ({
          label: `${p.productionNumber || p.batchNumber || p.id.slice(0, 8)} - ${p.product?.name || 'Water'} (Batch Qty: ${p.quantity} ${p.product?.unit || 'Units'})`,
          value: p.id,
        }))
      : [{ label: 'No production batches available', value: '' }];

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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Source Type"
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={sourceOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Inspection Status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
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
              data={paginatedRecords}
              loading={isLoading}
              emptyText="No Goods Received Notes found"
              emptyDescription="No GRN entries have been created yet. Generate a new GRN when receiving bottled batches from production or materials from suppliers."
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
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
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Select Production Batch"
                required
                value={selectedProductionId}
                onChange={(e) => setSelectedProductionId(e.target.value)}
                options={productionOptions}
              />

              <Input
                label="GRN Reference # (Leave blank for auto-numbering)"
                placeholder="e.g. GRN-2026-0091"
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

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#64748B] block">Batch Product</span>
                  <span className="font-bold text-[#172033]">
                    {selectedProd?.product?.name || (selectedProductionId ? 'Product not linked' : 'Select a batch above')}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Unit</span>
                  <span className="font-mono font-bold text-[#0F4C81]">
                    {selectedProd?.product?.unit || '--'}
                  </span>
                </div>
              </div>
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
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} leftIcon={<FileCheck2 className="w-4 h-4" />}>
                {isSubmitting ? 'Saving...' : 'Acknowledge & Save GRN'}
              </Button>
            </div>
          </form>
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
