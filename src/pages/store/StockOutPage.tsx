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
  ArrowUpFromLine,
  Search,
  Plus,
  Truck,
  FilterX,
  Package,
  Factory,
  CheckCircle2
} from 'lucide-react';

export default function StockOutPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransaction | null>(null);

  // Outward Issuance Form state (UI shell ready for API)
  const [formMaterial, setFormMaterial] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('pcs');
  const [formDestination, setFormDestination] = useState('line_1');
  const [formRequisition, setFormRequisition] = useState('');
  const [formReason, setFormReason] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // API-ready state
  const transactions: StockTransaction[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

  const destinationOptions = [
    { label: 'All Destinations', value: 'all' },
    { label: 'Bottling Line 1 (1L & 500ml)', value: 'line_1' },
    { label: 'Bottling Line 2 (20L Jars)', value: 'line_2' },
    { label: 'Water RO Filtration Plant', value: 'filtration' },
    { label: 'Packaging & Shrink Tunnel', value: 'packaging' },
    { label: 'Quality Control Laboratory', value: 'qc_lab' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Issued & Deducted', value: 'completed' },
    { label: 'Pending Store Approval', value: 'pending' },
    { label: 'Cancelled Requisition', value: 'cancelled' },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setDestinationFilter('all');
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
      setFormRequisition('');
      setFormReason('');
    }, 1200);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Stock Outward Issuance"
          description="Log material issuance to bottling production lines, maintenance requisitions, and authorized stock deductions."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Stock Out' }
          ]}
          secondaryActions={[
            {
              label: 'Dispatch Orders',
              href: '/store/dispatch',
              icon: <Truck className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Issue Materials (OUT)',
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
                  label="Search Outward Slips"
                  placeholder="Search by Slip #, material, or requisition..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Destination / Line"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  options={destinationOptions}
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

                {(searchQuery || destinationFilter !== 'all' || statusFilter !== 'all') && (
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

        {/* Stock OUT Transaction Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ArrowUpFromLine className="w-5 h-5 text-[#1597D4]" />
                  <span>Stock Outward Issuance Log</span>
                </CardTitle>
                <CardDescription>
                  Chronological records of raw preforms, caps, chemicals, and packaging issued to production.
                </CardDescription>
              </div>

              <Badge variant="secondary" size="sm">
                Issuance Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <StockTransactionTable
              transactions={transactions}
              loading={isLoading}
              emptyText="No stock-out transactions found"
              emptyDescription="No outward material issuances have been recorded yet. Click 'Issue Materials (OUT)' to log a line transfer."
              onViewDetails={(item) => setSelectedTransaction(item)}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </CardContent>
        </Card>

        {/* Modal: New Stock-OUT Entry */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <ArrowUpFromLine className="w-5 h-5 text-[#1597D4]" />
              <span>Issue Material from Store</span>
            </div>
          }
          description="Log material issuance and deduct inventory quantity for production."
          size="lg"
        >
          {submittedMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#1597D4]/10 text-[#1597D4] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#172033]">Issuance Requisition Staged</h4>
              <p className="text-xs text-[#64748B]">Transaction payload prepared for backend inventory deduction API.</p>
            </div>
          ) : (
            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Material / SKU to Issue"
                  required
                  placeholder="e.g. 28mm Blue Screw Caps"
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  leftIcon={<Package className="w-4 h-4" />}
                />

                <Select
                  label="Destination / Production Line"
                  required
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  options={[
                    { label: 'Bottling Line 1 (1L & 500ml)', value: 'line_1' },
                    { label: 'Bottling Line 2 (20L Jars)', value: 'line_2' },
                    { label: 'Water RO Filtration Plant', value: 'filtration' },
                    { label: 'Packaging & Shrink Tunnel', value: 'packaging' },
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Quantity to Issue"
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
                  ]}
                />

                <Input
                  label="Requisition / Order #"
                  required
                  placeholder="e.g. REQ-2026-041"
                  value={formRequisition}
                  onChange={(e) => setFormRequisition(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Purpose / Production Batch Reference"
                  placeholder="e.g. For Batch B402 - 10,000 unit bottling run"
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  leftIcon={<Factory className="w-4 h-4" />}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" leftIcon={<ArrowUpFromLine className="w-4 h-4" />}>
                  Authorize Issuance
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
            title={`Outward Slip: ${selectedTransaction.reference}`}
            description="Detailed record for outward stock issuance."
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
                  <span className="text-[#64748B] block">Destination</span>
                  <span>{selectedTransaction.destinationOrSource || '--'}</span>
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
