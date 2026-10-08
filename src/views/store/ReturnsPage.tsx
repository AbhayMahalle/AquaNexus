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
  RotateCcw,
  Search,
  Plus,
  FilterX,
  Package,
  Clock,
  Eye,
  Building2,
  Edit2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export interface StoreReturnRecord {
  id: string;
  returnNumber: string;
  productName: string;
  sku?: string;
  quantity: number;
  unit: string;
  source: string;
  returnType: 'empty_jar' | 'vendor_exchange' | 'customer_return' | 'qa_rejection';
  date: string;
  processedBy: string;
  status: 'REQUESTED' | 'APPROVED' | 'RECEIVED' | 'INSPECTED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
  returnItems?: any[];
}

export default function ReturnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<StoreReturnRecord | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Status update form states
  const [updateStatus, setUpdateStatus] = useState<StoreReturnRecord['status']>('RECEIVED');
  const [updateRemarks, setUpdateRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Entry Form states
  const [distributors, setDistributors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formDistributorId, setFormDistributorId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formReturnNo, setFormReturnNo] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formCondition, setFormCondition] = useState<'GOOD' | 'DAMAGED'>('GOOD');
  const [formType, setFormType] = useState<'empty_jar' | 'vendor_exchange' | 'customer_return' | 'qa_rejection'>('empty_jar');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API State
  const [returnRecords, setReturnRecords] = useState<StoreReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load distributors and products for dropdowns
  useEffect(() => {
    async function loadDropdowns() {
      try {
        const [distRes, prodRes] = await Promise.all([
          apiRequest<any>('/api/distributors'),
          apiRequest<any>('/api/products?limit=100'),
        ]);

        if (distRes.ok && distRes.data) {
          const list = distRes.data.distributors || (Array.isArray(distRes.data) ? distRes.data : []);
          setDistributors(list);
          if (list.length > 0) setFormDistributorId(list[0].id);
        }

        if (prodRes.ok && prodRes.data) {
          const list = prodRes.data.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
          setProducts(list);
          if (list.length > 0) setFormProductId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load dropdown data for returns:', err);
      }
    }
    loadDropdowns();
  }, []);

  // Load returns from backend
  const loadReturns = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/api/returns');
      if (res.ok && res.data) {
        const list = res.data.returns || (Array.isArray(res.data) ? res.data : []);
        const mapped: StoreReturnRecord[] = list.map((r: any) => {
          const totalQty = (r.returnItems || []).reduce(
            (sum: number, it: any) => sum + (Number(it.quantity) || 0),
            0
          );
          const productNames =
            (r.returnItems || [])
              .map((it: any) => it.product?.name)
              .filter(Boolean)
              .join(', ') || 'Returned Goods';
          const sku = r.returnItems?.[0]?.product?.sku || '--';
          const unit = r.returnItems?.[0]?.product?.unit || 'Units';

          const reasonLower = (r.reason || '').toLowerCase();
          let returnType: StoreReturnRecord['returnType'] = 'customer_return';
          if (reasonLower.includes('vendor')) returnType = 'vendor_exchange';
          else if (reasonLower.includes('qa') || reasonLower.includes('rejection') || reasonLower.includes('defect')) returnType = 'qa_rejection';
          else if (reasonLower.includes('jar') || reasonLower.includes('empty')) returnType = 'empty_jar';

          const rawStatus = (r.status || 'REQUESTED').toUpperCase().replace(/[-\s]/g, '_');
          const validStatuses = ['REQUESTED', 'APPROVED', 'RECEIVED', 'INSPECTED', 'COMPLETED', 'REJECTED', 'CANCELLED'];
          const normStatus = validStatuses.includes(rawStatus) ? rawStatus : 'REQUESTED';

          return {
            id: r.id,
            returnNumber: r.returnNumber || `RET-${r.id.slice(0, 8)}`,
            productName: productNames,
            sku,
            quantity: totalQty,
            unit,
            source: r.distributor?.name || 'Distributor Route',
            returnType,
            date: new Date(r.returnDate || r.createdAt || Date.now()).toLocaleDateString(),
            processedBy: r.creator ? `${r.creator.firstName || ''} ${r.creator.lastName || ''}`.trim() : 'Store Staff',
            status: normStatus as StoreReturnRecord['status'],
            notes: r.reason || '',
            returnItems: r.returnItems || [],
          };
        });

        setReturnRecords(mapped);
      }
    } catch (err) {
      console.error('Failed to load returns:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReturns();
  }, [loadReturns]);

  // Open Status Update Modal
  const handleOpenStatusModal = (ret: StoreReturnRecord) => {
    setSelectedReturn(ret);
    setUpdateStatus(ret.status);
    setUpdateRemarks(ret.notes || '');
    setIsStatusModalOpen(true);
  };

  // Submit Return Status Update
  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    setIsUpdatingStatus(true);
    try {
      const res = await apiRequest<any>(`/api/returns/${selectedReturn.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: updateStatus,
          remarks: updateRemarks.trim() || undefined,
        }),
      });

      if (res.ok) {
        showToast(`Return status updated to ${updateStatus} successfully! Inventory synchronized.`, 'success');
        setIsStatusModalOpen(false);
        setSelectedReturn(null);
        await loadReturns();
      } else {
        showToast(res.error || 'Failed to update return status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating return status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Submit New Return
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDistributorId || !formProductId || !formQuantity || Number(formQuantity) <= 0) {
      showToast('Please select a distributor, product, and valid quantity', 'error');
      return;
    }

    const qty = parseInt(formQuantity, 10);
    setIsSubmitting(true);
    try {
      const returnNum = formReturnNo.trim() || `RET-${Date.now().toString().slice(-6)}`;
      const res = await apiRequest<any>('/api/returns', {
        method: 'POST',
        body: JSON.stringify({
          returnNumber: returnNum,
          distributorId: formDistributorId,
          returnDate: new Date().toISOString().slice(0, 10),
          reason: `${formType.toUpperCase()}: ${formNotes || 'Customer return deposit'}. Condition: ${formCondition}`,
          items: [
            {
              productId: formProductId,
              quantity: qty,
              condition: formCondition,
              remarks: formNotes || 'Processed by store inward',
            },
          ],
        }),
      });

      if (res.ok) {
        showToast('Return recorded successfully!', 'success');
        setIsEntryModalOpen(false);
        setFormReturnNo('');
        setFormQuantity('');
        setFormNotes('');
        await loadReturns();
      } else {
        showToast(res.error || 'Failed to process return', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting return', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    return returnRecords.filter((record) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesRet = record.returnNumber?.toLowerCase().includes(query);
        const matchesProd = record.productName?.toLowerCase().includes(query);
        const matchesSku = record.sku?.toLowerCase().includes(query);
        const matchesSrc = record.source?.toLowerCase().includes(query);
        const matchesNotes = record.notes?.toLowerCase().includes(query);

        if (!matchesRet && !matchesProd && !matchesSku && !matchesSrc && !matchesNotes) {
          return false;
        }
      }

      if (typeFilter !== 'all' && record.returnType !== typeFilter) {
        return false;
      }

      if (statusFilter !== 'all') {
        if (record.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [returnRecords, searchQuery, typeFilter, statusFilter]);

  const itemsPerPage = 10;
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const columns: Column<StoreReturnRecord>[] = [
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
      key: 'returnNumber',
      header: 'Return Number',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.returnNumber}</span>,
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
      header: 'Quantity',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantity} {r.unit}
        </span>
      ),
    },
    {
      key: 'source',
      header: 'Distributor / Customer',
      render: (r) => <span className="text-xs text-[#172033] font-medium">{r.source}</span>,
    },
    {
      key: 'status',
      header: 'Return Status',
      render: (r) => {
        const statusMap: Record<string, { variant: 'success' | 'warning' | 'info' | 'danger' | 'neutral'; label: string }> = {
          REQUESTED: { variant: 'warning', label: 'REQUESTED' },
          APPROVED: { variant: 'info', label: 'APPROVED' },
          RECEIVED: { variant: 'info', label: 'RECEIVED' },
          INSPECTED: { variant: 'neutral', label: 'INSPECTED' },
          COMPLETED: { variant: 'success', label: 'COMPLETED' },
          REJECTED: { variant: 'danger', label: 'REJECTED' },
          CANCELLED: { variant: 'neutral', label: 'CANCELLED' },
        };
        const config = statusMap[r.status] || { variant: 'info', label: r.status };
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
            onClick={() => setSelectedReturn(r)}
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
          title="Customer & Distributor Returns"
          description="Log and manage empty reusable 20L jars, customer exchange bottles, and defective returns with inventory updates."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Returns' }
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
            label: 'Receive Inward Return',
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
                  label="Search Returns"
                  placeholder="Search by Return #, Customer, Product, or Reason..."
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
                  label="Filter by Return Type"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Return Classifications', value: 'all' },
                    { label: 'Empty 20L Jar (Deposit)', value: 'empty_jar' },
                    { label: 'Customer Return', value: 'customer_return' },
                    { label: 'Vendor Exchange', value: 'vendor_exchange' },
                    { label: 'QA / Line Rejection', value: 'qa_rejection' },
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Filter by Return Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Requested', value: 'REQUESTED' },
                    { label: 'Approved', value: 'APPROVED' },
                    { label: 'Received (Restocked)', value: 'RECEIVED' },
                    { label: 'Inspected', value: 'INSPECTED' },
                    { label: 'Completed', value: 'COMPLETED' },
                    { label: 'Rejected', value: 'REJECTED' },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Showing <strong className="text-[#172033]">{filteredRecords.length}</strong> return entries
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

        {/* Returns Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-[#0F4C81]" />
                  <span>Returns & Deposit Ledger</span>
                </CardTitle>
                <CardDescription>
                  Tracking empty bottle returns and defective exchange consignments.
                </CardDescription>
              </div>

              <Badge variant="primary" size="sm">
                Live Returns Ledger
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={paginatedRecords}
              loading={isLoading}
              emptyText="No returns found"
              emptyDescription="No return records match your filter criteria. Click 'Receive Inward Return' to process incoming returns."
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

        {/* Modal: New Inward Return */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#0F4C81]" />
              <span>Record Inward Return</span>
            </div>
          }
          description="Log customer empties or damaged goods returning to the central plant warehouse."
          size="lg"
        >
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Distributor / Route Customer"
                required
                value={formDistributorId}
                onChange={(e) => setFormDistributorId(e.target.value)}
                options={distributors.map((d) => ({
                  label: `${d.name} (${d.distributorCode})`,
                  value: d.id,
                }))}
              />

              <Input
                label="Return Challan / Slip #"
                placeholder="e.g. RET-2026-0041"
                value={formReturnNo}
                onChange={(e) => setFormReturnNo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Product Returned"
                required
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} (${p.sku})`,
                  value: p.id,
                }))}
              />

              <Input
                label="Quantity Returned"
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
                label="Physical Condition"
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value as any)}
                options={[
                  { label: 'GOOD (Intact & Clean, Suitable for Restock)', value: 'GOOD' },
                  { label: 'DAMAGED (Cracked, Contaminated, Scrapped)', value: 'DAMAGED' },
                ]}
              />

              <Select
                label="Return Category"
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                options={[
                  { label: 'Empty 20L Jars (Reusable Deposit)', value: 'empty_jar' },
                  { label: 'Customer / Distributor Return', value: 'customer_return' },
                  { label: 'Vendor Material Exchange', value: 'vendor_exchange' },
                  { label: 'QA / Line Rejection', value: 'qa_rejection' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Inspection Remarks"
                placeholder="e.g. Empty jars inspected and verified for washing & sanitization"
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
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                {isSubmitting ? 'Recording...' : 'Record Return'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Update Return Status */}
        {selectedReturn && (
          <Modal
            isOpen={isStatusModalOpen}
            onClose={() => {
              setIsStatusModalOpen(false);
              setSelectedReturn(null);
            }}
            title={
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#0F4C81]" />
                <span>Update Return Status: {selectedReturn.returnNumber}</span>
              </div>
            }
            description="Manage return inspection stage. Goods in GOOD condition will be restocked to store inventory."
            size="md"
          >
            <form onSubmit={handleStatusUpdateSubmit} className="space-y-4">
              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Distributor:</span>
                  <strong className="text-[#172033]">{selectedReturn.source}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Items:</span>
                  <strong className="text-[#172033]">{selectedReturn.quantity} {selectedReturn.unit}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Current Status:</span>
                  <Badge variant="secondary" size="sm">{selectedReturn.status}</Badge>
                </div>
              </div>

              <div>
                <Select
                  label="Update Return Status"
                  required
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value as any)}
                  options={[
                    { label: 'REQUESTED - Return filed, awaiting store arrival', value: 'REQUESTED' },
                    { label: 'APPROVED - Approved by Store Manager', value: 'APPROVED' },
                    { label: 'RECEIVED - Physical goods arrived at store (Restock GOOD items)', value: 'RECEIVED' },
                    { label: 'INSPECTED - Quality inspection completed', value: 'INSPECTED' },
                    { label: 'COMPLETED - Process completed', value: 'COMPLETED' },
                    { label: 'REJECTED - Return rejected (Reverts any added stock)', value: 'REJECTED' },
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Inspection Remarks / Notes"
                  placeholder="e.g. 50 empty jars received intact, restocked to central storage"
                  value={updateRemarks}
                  onChange={(e) => setUpdateRemarks(e.target.value)}
                />
              </div>

              <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl text-xs text-[#166534] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                <span>
                  Items marked GOOD are safely restocked into Store Inventory without duplicate counting. DAMAGED items are quarantined.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsStatusModalOpen(false);
                    setSelectedReturn(null);
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

        {/* Modal: View Return Details */}
        {selectedReturn && !isStatusModalOpen && (
          <Modal
            isOpen={!!selectedReturn}
            onClose={() => setSelectedReturn(null)}
            title={`Return Details: ${selectedReturn.returnNumber}`}
            description="Complete audit log of returned items and inspection status."
            footer={
              <div className="flex items-center justify-between w-full">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenStatusModal(selectedReturn)}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Change Status
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSelectedReturn(null)}>
                  Close
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block">Return Slip #</span>
                  <span className="font-bold text-[#172033]">{selectedReturn.returnNumber}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Distributor Route</span>
                  <span className="font-bold text-[#172033]">{selectedReturn.source}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Product</span>
                  <span className="font-bold text-[#172033]">{selectedReturn.productName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Total Quantity</span>
                  <span className="font-mono font-bold text-[#172033]">{selectedReturn.quantity} {selectedReturn.unit}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Status</span>
                  <Badge variant="primary" size="sm">{selectedReturn.status}</Badge>
                </div>
                <div>
                  <span className="text-[#64748B] block">Date</span>
                  <span>{selectedReturn.date}</span>
                </div>
              </div>

              {selectedReturn.returnItems && selectedReturn.returnItems.length > 0 && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block mb-2 font-semibold">Item Condition Breakdown:</span>
                  <div className="space-y-1">
                    {selectedReturn.returnItems.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs py-1 border-b border-[#E2E8F0] last:border-0">
                        <span>{it.product?.name || 'Item'} (Qty: {it.quantity})</span>
                        <Badge variant={it.condition === 'GOOD' ? 'success' : 'danger'} size="sm">
                          {it.condition}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReturn.notes && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block mb-1">Remarks & Reason:</span>
                  <p className="text-[#172033]">{selectedReturn.notes}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
