import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StockTransactionTable, StockTransaction } from './StockTransactionTable';
import {
  ArrowDownToLine,
  Search,
  Plus,
  FileCheck2,
  FilterX,
  Package,
  Building2,
  CheckCircle2
} from 'lucide-react';

export default function StockInPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransaction | null>(null);

  // Inward Entry Form state (UI shell ready for API)
  const [formMaterial, setFormMaterial] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formSource, setFormSource] = useState('supplier');
  const [formReference, setFormReference] = useState('');
  const [formBin, setFormBin] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // API-ready state
  const transactions: StockTransaction[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

  const sourceOptions = [
    { label: 'All Inward Sources', value: 'all' },
    { label: 'Supplier / Vendor Consignment', value: 'supplier' },
    { label: 'Goods Received Note (GRN)', value: 'grn' },
    { label: 'Production Plant Return', value: 'production_return' },
    { label: 'Inter-warehouse Transfer', value: 'transfer' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Completed & Stored', value: 'completed' },
    { label: 'Pending QA Inspection', value: 'pending' },
    { label: 'Flagged / Discrepancy', value: 'flagged' },
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
      // Reset form
      setFormMaterial('');
      setFormQuantity('');
      setFormReference('');
      setFormBin('');
      setFormNotes('');
    }, 1200);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Stock Inward Transactions"
          description="Record incoming consignments, supplier deliveries, batch receipts, and warehouse inward material additions."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Stock In' }
          ]}
          secondaryActions={[
            {
              label: 'Goods Received (GRN)',
              href: '/store/goods-received',
              icon: <FileCheck2 className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'New Stock-IN Entry',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setIsEntryModalOpen(true),
          }}
        />

        {/* Search & Filtering Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Search Inward Slips"
                  placeholder="Search by Slip #, item name, or supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Inward Source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  options={sourceOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Status Filter"
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

        {/* Stock IN Transaction Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-[#16A34A]" />
                  <span>Stock Inward Log</span>
                </CardTitle>
                <CardDescription>
                  Chronological receipts of plant materials, bottles, caps, and chemicals with supplier references.
                </CardDescription>
              </div>

              <Badge variant="success" size="sm">
                Inward Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <StockTransactionTable
              transactions={transactions}
              loading={isLoading}
              emptyText="No stock-in transactions found"
              emptyDescription="No inward transactions have been recorded yet. Click 'New Stock-IN Entry' to log a received shipment."
              onViewDetails={(item) => setSelectedTransaction(item)}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </CardContent>
        </Card>

        {/* Modal: New Stock-IN Entry */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <ArrowDownToLine className="w-5 h-5 text-[#16A34A]" />
              <span>Record Inward Stock Entry</span>
            </div>
          }
          description="Log material delivery receipts into warehouse inventory bins."
          size="lg"
        >
          {submittedMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#172033]">Inward Slip Staged</h4>
              <p className="text-xs text-[#64748B]">Transaction payload prepared for backend inventory API persistence.</p>
            </div>
          ) : (
            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Material / Item Name"
                  required
                  placeholder="e.g. 24g PET Preforms (1L)"
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  leftIcon={<Package className="w-4 h-4" />}
                />

                <Select
                  label="Inward Source"
                  required
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  options={[
                    { label: 'Vendor / Supplier Delivery', value: 'supplier' },
                    { label: 'Goods Received Note (GRN)', value: 'grn' },
                    { label: 'Production Line Return', value: 'production_return' },
                  ]}
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
                    { label: 'Pcs / Units', value: 'pcs' },
                    { label: 'Boxes / Crates', value: 'boxes' },
                    { label: 'Liters (L)', value: 'liters' },
                    { label: 'Kilograms (Kg)', value: 'kg' },
                    { label: 'Bags', value: 'bags' },
                  ]}
                />

                <Input
                  label="PO / Invoice / Challan #"
                  required
                  placeholder="e.g. PO-2026-0901"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Storage Bin / Location"
                  placeholder="e.g. Warehouse Rack B-04"
                  value={formBin}
                  onChange={(e) => setFormBin(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                />

                <Input
                  label="Remarks / Batch Details"
                  placeholder="e.g. Batch #B402 - Inspection passed"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" leftIcon={<ArrowDownToLine className="w-4 h-4" />}>
                  Save Inward Record
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal: Transaction Details View */}
        {selectedTransaction && (
          <Modal
            isOpen={!!selectedTransaction}
            onClose={() => setSelectedTransaction(null)}
            title={`Inward Transaction: ${selectedTransaction.reference}`}
            description="Detailed record for inward material entry."
            footer={
              <Button variant="outline" size="sm" onClick={() => setSelectedTransaction(null)}>
                Close
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] block">Material</span>
                  <span className="font-bold text-[#172033]">{selectedTransaction.materialName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Quantity</span>
                  <span className="font-bold font-mono text-[#172033]">{selectedTransaction.quantity} {selectedTransaction.unit}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Date</span>
                  <span>{selectedTransaction.date}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Store Officer</span>
                  <span>{selectedTransaction.officer}</span>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
