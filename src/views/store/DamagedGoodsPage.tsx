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

  // Form states
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [formIncidentNo, setFormIncidentNo] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formType, setFormType] = useState<'cracked_jar' | 'defective_cap' | 'broken_preform' | 'chemical_expired' | 'transit_loss'>('cracked_jar');
  const [formReason, setFormReason] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API state
  const [damagedRecords, setDamagedRecords] = useState<DamagedItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Load products list
  React.useEffect(() => {
    async function loadProducts() {
      const res = await apiRequest<any>('/api/products');
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

  // Load damaged records
  const loadDamagedRecords = React.useCallback(async () => {
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

          return {
            id: tx.id,
            incidentNumber: tx.referenceId || `DMG-${tx.id.slice(0, 8).toUpperCase()}`,
            productName: tx.product?.name || 'Damaged Product',
            sku: tx.product?.sku || '--',
            quantity: tx.quantity,
            unit: tx.product?.unit || 'Units',
            damageReason: tx.remarks || 'Stock write-off',
            damageType,
            date: new Date(tx.createdAt).toLocaleDateString(),
            reportedBy: tx.creator ? `${tx.creator.firstName || ''} ${tx.creator.lastName || ''}`.trim() : 'Store Staff',
            status: 'approved_writeoff',
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

  React.useEffect(() => {
    loadDamagedRecords();
  }, [loadDamagedRecords]);

  const filteredRecords = React.useMemo(() => {
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

      if (statusFilter !== 'all' && r.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [damagedRecords, searchQuery, typeFilter, statusFilter]);

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

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !formQuantity) {
      showToast('Please select a product and enter quantity', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/stock-transactions', {
        method: 'POST',
        body: JSON.stringify({
          productId: selectedProductId,
          transactionType: 'DAMAGED',
          quantity: Number(formQuantity),
          referenceType: formType,
          referenceId: formIncidentNo.trim() || `DMG-${Date.now()}`,
          remarks: `${formReason}. Notes: ${formNotes}`,
        }),
      });

      if (res.ok) {
        showToast('Damage write-off recorded successfully!', 'success');
        setIsEntryModalOpen(false);
        setFormIncidentNo('');
        setFormQuantity('');
        setFormReason('');
        setFormNotes('');
        loadDamagedRecords();
      } else {
        showToast(res.error || 'Failed to record damaged stock', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error reporting damaged stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
              data={filteredRecords}
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
              <Select
                label="Product / Material Damaged"
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} (${p.sku})`,
                  value: p.id,
                }))}
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
                label={`Quantity Damaged (${products.find(p => p.id === selectedProductId)?.unit || 'Units'})`}
                required
                type="number"
                placeholder="0"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
              />

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#64748B] block">Product SKU</span>
                  <span className="font-mono font-bold text-[#0F4C81]">
                    {products.find((p) => p.id === selectedProductId)?.sku || '--'}
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Standard Unit</span>
                  <span className="font-bold text-[#172033]">
                    {products.find((p) => p.id === selectedProductId)?.unit || 'Units'}
                  </span>
                </div>
              </div>
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
              <Button variant="danger" size="sm" type="submit" disabled={isSubmitting} leftIcon={<AlertOctagon className="w-4 h-4" />}>
                {isSubmitting ? 'Submitting...' : 'Submit Damage Report'}
              </Button>
            </div>
          </form>
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
