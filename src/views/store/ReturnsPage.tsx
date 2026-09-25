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
  Building2
} from 'lucide-react';

export interface StoreReturnRecord {
  id: string;
  returnNumber: string;
  productName: string;
  sku?: string;
  quantity: string | number;
  unit: string;
  source: string;
  returnType: 'empty_jar' | 'vendor_exchange' | 'customer_return' | 'qa_rejection';
  date: string;
  processedBy: string;
  status: 'restocked' | 'pending_inspection' | 'credited' | 'scrapped';
  notes?: string;
}

export default function ReturnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<StoreReturnRecord | null>(null);

  // Form states
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
              .join(', ') || 'Returned Water Goods';
          const sku = r.returnItems?.[0]?.product?.sku || '--';
          const unit = r.returnItems?.[0]?.product?.unit || 'Units';

          const reasonLower = (r.reason || '').toLowerCase();
          let returnType: StoreReturnRecord['returnType'] = 'empty_jar';
          if (reasonLower.includes('vendor')) returnType = 'vendor_exchange';
          else if (reasonLower.includes('qa') || reasonLower.includes('rejection') || reasonLower.includes('defect')) returnType = 'qa_rejection';
          else if (reasonLower.includes('customer') || reasonLower.includes('distributor')) returnType = 'customer_return';
          else if (reasonLower.includes('jar') || reasonLower.includes('bottle')) returnType = 'empty_jar';
          else returnType = 'customer_return';

          const statusRaw = (r.status || 'restocked').toLowerCase();
          let status: StoreReturnRecord['status'] = 'restocked';
          if (statusRaw === 'received' || statusRaw === 'approved' || statusRaw === 'restocked') status = 'restocked';
          else if (statusRaw === 'requested' || statusRaw === 'pending' || statusRaw === 'pending_inspection') status = 'pending_inspection';
          else if (statusRaw === 'credited') status = 'credited';
          else if (statusRaw === 'rejected' || statusRaw === 'cancelled' || statusRaw === 'scrapped') status = 'scrapped';
          else status = 'restocked';

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
            status,
            notes: r.reason || '',
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

  // Combined Filtering
  const filteredRecords = useMemo(() => {
    return returnRecords.filter((r) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesNo = r.returnNumber?.toLowerCase().includes(query);
        const matchesSource = r.source?.toLowerCase().includes(query);
        const matchesProd = r.productName?.toLowerCase().includes(query);
        const matchesSku = r.sku?.toLowerCase().includes(query);
        const matchesNotes = r.notes?.toLowerCase().includes(query);

        if (!matchesNo && !matchesSource && !matchesProd && !matchesSku && !matchesNotes) {
          return false;
        }
      }

      if (typeFilter !== 'all') {
        if (r.returnType !== typeFilter) {
          return false;
        }
      }

      if (statusFilter !== 'all') {
        if (r.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [returnRecords, searchQuery, typeFilter, statusFilter]);

  // Pagination
  const itemsPerPage = 10;
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const typeOptions = [
    { label: 'All Return Types', value: 'all' },
    { label: 'Empty 20L Jars (Reusable Deposit)', value: 'empty_jar' },
    { label: 'Customer / Distributor Return', value: 'customer_return' },
    { label: 'Vendor Defect Exchange', value: 'vendor_exchange' },
    { label: 'QA / Bottling Line Rejection', value: 'qa_rejection' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Restocked & Washed', value: 'restocked' },
    { label: 'Pending Inspection', value: 'pending_inspection' },
    { label: 'Deposit Credited', value: 'credited' },
    { label: 'Sent to Scrap', value: 'scrapped' },
  ];

  const columns: Column<StoreReturnRecord>[] = [
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
      key: 'returnNumber',
      header: 'Return Ref #',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.returnNumber}</span>
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
      key: 'returnType',
      header: 'Return Type',
      render: (r) => {
        const typeLabels: Record<string, string> = {
          empty_jar: 'Empty 20L Jar',
          customer_return: 'Customer Return',
          vendor_exchange: 'Vendor Exchange',
          qa_rejection: 'QA Rejection',
        };
        return <Badge variant="secondary" size="sm">{typeLabels[r.returnType] || r.returnType}</Badge>;
      }
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantity} {r.unit}
        </span>
      )
    },
    {
      key: 'source',
      header: 'Source / Customer',
      render: (r) => <span className="text-xs text-[#172033]">{r.source}</span>
    },
    {
      key: 'processedBy',
      header: 'Processed By',
      render: (r) => <span className="text-xs text-[#64748B]">{r.processedBy}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusMap: Record<string, { variant: 'success' | 'warning' | 'info' | 'danger'; label: string }> = {
          restocked: { variant: 'success', label: 'RESTOCKED' },
          pending_inspection: { variant: 'warning', label: 'INSPECTION' },
          credited: { variant: 'info', label: 'CREDITED' },
          scrapped: { variant: 'danger', label: 'SCRAPPED' },
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
          onClick={() => setSelectedReturn(r)}
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
    if (!formDistributorId || !formProductId || !formQuantity || Number(formQuantity) <= 0) {
      showToast('Please select a distributor, product, and valid quantity', 'error');
      return;
    }

    const qty = parseInt(formQuantity, 10);
    setIsSubmitting(true);
    try {
      const typeLabels: Record<string, string> = {
        empty_jar: 'Empty 20L Jars (Reusable Deposit)',
        customer_return: 'Customer / Distributor Return',
        vendor_exchange: 'Vendor Material Exchange',
        qa_rejection: 'QA / Line Rejection',
      };

      const reasonString = [
        `Type: ${typeLabels[formType] || formType}`,
        formNotes.trim() ? formNotes.trim() : '',
      ].filter(Boolean).join(' | ');

      const payload = {
        returnNumber: formReturnNo.trim() || `RET-${Date.now().toString().slice(-6)}`,
        distributorId: formDistributorId,
        returnDate: new Date().toISOString(),
        reason: reasonString,
        items: [
          {
            productId: formProductId,
            quantity: qty,
            condition: formCondition,
            remarks: formNotes.trim() || undefined,
          },
        ],
      };

      const res = await apiRequest<any>('/api/returns', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Stock return entry recorded successfully!', 'success');
        setIsEntryModalOpen(false);
        setFormReturnNo('');
        setFormQuantity('');
        setFormNotes('');
        await loadReturns();
      } else {
        showToast(res.error || 'Failed to record return entry', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing return entry', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductObj = products.find((p) => p.id === formProductId);

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Stock Returns & Empty Jar Ledger"
          description="Track incoming reusable 20L empty water jars, distributor deposit returns, and defective batch replacements."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Returns' }
          ]}
          secondaryActions={[
            {
              label: 'Store Inventory',
              href: '/store/inventory',
              icon: <Package className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Log Return Entry',
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
                  label="Search Returns"
                  placeholder="Search by Return #, customer, or product..."
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
                  label="Return Type"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={typeOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Return Status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
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
                  Inward return entries treated as traceable inventory intake transactions.
                </CardDescription>
              </div>

              <Badge variant="primary" size="sm">
                Reverse Logistics Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={paginatedRecords}
              loading={isLoading}
              emptyText="No return records found"
              emptyDescription="No bottle or material returns are currently logged. Click 'Log Return Entry' to record incoming empty jars or returned stock."
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

        {/* Modal: Log Return Entry */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-[#0F4C81]" />
              <span>Log Stock / Jar Return Entry</span>
            </div>
          }
          description="Record incoming returned bottles or replacement goods into store holding."
          size="lg"
        >
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Return Slip Reference #"
                placeholder="e.g. RET-2026-0034"
                value={formReturnNo}
                onChange={(e) => setFormReturnNo(e.target.value)}
              />

              <Select
                label="Return Classification"
                required
                value={formType}
                onChange={(e) => setFormType(e.target.value as any)}
                options={[
                  { label: 'Empty 20L Water Jars (Deposit Return)', value: 'empty_jar' },
                  { label: 'Customer / Distributor Exchange', value: 'customer_return' },
                  { label: 'Vendor Material Exchange', value: 'vendor_exchange' },
                  { label: 'QA / Line Rejection', value: 'qa_rejection' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Return Source / Distributor"
                required
                value={formDistributorId}
                onChange={(e) => setFormDistributorId(e.target.value)}
                options={distributors.map((d) => ({
                  label: `${d.name} (${d.distributorCode || 'Distributor'}${d.salesArea ? ` - ${d.salesArea.name}` : ''})`,
                  value: d.id,
                }))}
              />

              <Select
                label="Product / Item Returned"
                required
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} (${p.unit || 'Units'})`,
                  value: p.id,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Input
                label="Quantity Returned"
                required
                type="number"
                min="1"
                placeholder="0"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
              />

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs h-[42px]">
                <span className="text-[#64748B]">Packaging Unit:</span>
                <span className="font-bold text-[#0F4C81]">
                  {selectedProductObj?.unit || 'Units'}
                </span>
              </div>

              <Select
                label="Bottle / Item Condition"
                value={formCondition}
                onChange={(e) => setFormCondition(e.target.value as any)}
                options={[
                  { label: 'Good (Reusable / Restockable)', value: 'GOOD' },
                  { label: 'Damaged (Crack / Rejection)', value: 'DAMAGED' },
                ]}
              />
            </div>

            <div>
              <Input
                label="Condition & Remarks"
                placeholder="e.g. 50 jars sanitized, 2 jars flagged for crack inspection"
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
                {isSubmitting ? 'Recording Return...' : 'Save Return Entry'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: View Details */}
        {selectedReturn && (
          <Modal
            isOpen={!!selectedReturn}
            onClose={() => setSelectedReturn(null)}
            title={`Return Slip: ${selectedReturn.returnNumber}`}
            description="Detailed return inspection record."
            footer={
              <Button variant="outline" size="sm" onClick={() => setSelectedReturn(null)}>
                Close
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] block">Product</span>
                  <span className="font-bold text-[#172033]">{selectedReturn.productName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Quantity</span>
                  <span className="font-mono font-bold text-[#172033]">{selectedReturn.quantity} {selectedReturn.unit}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Source / Distributor</span>
                  <span>{selectedReturn.source}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Processed Officer</span>
                  <span>{selectedReturn.processedBy}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Return Type</span>
                  <Badge variant="secondary" size="sm">{selectedReturn.returnType.replace('_', ' ').toUpperCase()}</Badge>
                </div>
                <div>
                  <span className="text-[#64748B] block">Inspection Status</span>
                  <Badge variant="success" size="sm">{selectedReturn.status.toUpperCase()}</Badge>
                </div>
                {selectedReturn.notes && (
                  <div className="col-span-2">
                    <span className="text-[#64748B] block">Remarks / Reason</span>
                    <span className="text-[#172033]">{selectedReturn.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}

