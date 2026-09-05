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
  RotateCcw,
  Search,
  Plus,
  FilterX,
  Package,
  Clock,
  Eye,
  CheckCircle2,
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

  // Form states (API-ready)
  const [formReturnNo, setFormReturnNo] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('jars');
  const [formSource, setFormSource] = useState('');
  const [formType, setFormType] = useState<'empty_jar' | 'vendor_exchange' | 'customer_return' | 'qa_rejection'>('empty_jar');
  const [formNotes, setFormNotes] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // API-ready state
  const returnRecords: StoreReturnRecord[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

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

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setIsEntryModalOpen(false);
      setFormReturnNo('');
      setFormProduct('');
      setFormQuantity('');
      setFormSource('');
      setFormNotes('');
    }, 1200);
  };

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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Return Type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  options={typeOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Return Status"
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
              data={returnRecords}
              loading={isLoading}
              emptyText="No return records found"
              emptyDescription="No bottle or material returns are currently logged. Click 'Log Return Entry' to record incoming empty jars or returned stock."
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
          {submittedMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#172033]">Return Slip Staged</h4>
              <p className="text-xs text-[#64748B]">Payload prepared for inventory intake & deposit reconciliation API.</p>
            </div>
          ) : (
            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Return Slip Reference #"
                  required
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
                    { label: 'Empty 20L Water Jars', value: 'empty_jar' },
                    { label: 'Customer / Distributor Exchange', value: 'customer_return' },
                    { label: 'Vendor Material Exchange', value: 'vendor_exchange' },
                    { label: 'QA / Line Rejection', value: 'qa_rejection' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Product / Item Description"
                  required
                  placeholder="e.g. Standard 20L Reusable Blue Water Jars"
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  leftIcon={<Package className="w-4 h-4" />}
                />

                <Input
                  label="Return Source / Distributor Name"
                  required
                  placeholder="e.g. Metro Retail Route #3"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Quantity Returned"
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
                    { label: 'Jars', value: 'jars' },
                    { label: 'Pcs', value: 'pcs' },
                    { label: 'Cartons', value: 'cartons' },
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
                <Button variant="primary" size="sm" type="submit" leftIcon={<RotateCcw className="w-4 h-4" />}>
                  Save Return Entry
                </Button>
              </div>
            </form>
          )}
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
                  <span className="text-[#64748B] block">Source</span>
                  <span>{selectedReturn.source}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Processed Officer</span>
                  <span>{selectedReturn.processedBy}</span>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
