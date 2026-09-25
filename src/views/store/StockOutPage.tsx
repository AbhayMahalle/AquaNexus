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
import { AuthGuard } from '@/components/auth/AuthGuard';
import { StockTransactionTable, StockTransaction } from './StockTransactionTable';
import { apiRequest, showToast } from '@/lib/api';
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

  // Outward Issuance Form state
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; unit: string }[]>([]);
  const [formQuantity, setFormQuantity] = useState('');
  const [formDestination, setFormDestination] = useState('line_1');
  const [formRequisition, setFormRequisition] = useState('');
  const [formReason, setFormReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API state
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load products list
  React.useEffect(() => {
    async function loadProducts() {
      const res = await apiRequest<any>('/api/products');
      if (res.ok && res.data) {
        const list = res.data.products || (Array.isArray(res.data) ? res.data : []);
        setProducts(list);
        if (list.length > 0) {
          setProductId(list[0].id);
        }
      }
    }
    loadProducts();
  }, []);

  // Load Stock Out transactions
  const loadTransactions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.append('transactionType', 'STOCK_OUT');
      q.append('page', '1');
      q.append('limit', '100');
      const res = await apiRequest<any>(`/api/stock-transactions?${q.toString()}`);
      if (res.ok && res.data) {
        const list = res.data.transactions || (Array.isArray(res.data) ? res.data : []);
        const mapped: StockTransaction[] = list.map((tx: any) => {
          let destLabel = 'Production Line';
          const refType = (tx.referenceType || '').toLowerCase();
          if (refType === 'line_1') destLabel = 'Bottling Line 1 (1L & 500ml)';
          else if (refType === 'line_2') destLabel = 'Bottling Line 2 (20L Jars)';
          else if (refType === 'filtration') destLabel = 'Water RO Filtration Plant';
          else if (refType === 'packaging') destLabel = 'Packaging & Shrink Tunnel';
          else if (refType === 'qc_lab') destLabel = 'Quality Control Laboratory';
          else if (tx.referenceType) destLabel = tx.referenceType;

          const refInRemarks = tx.remarks?.match(/\[Ref:\s*([^\]]+)\]/)?.[1];

          return {
            id: tx.id,
            reference: tx.referenceId || refInRemarks || tx.id.slice(0, 8).toUpperCase(),
            materialName: tx.product?.name || 'Unknown Item',
            sku: tx.product?.sku || '--',
            transactionType: 'OUT',
            quantity: tx.quantity,
            unit: tx.product?.unit || 'Units',
            date: new Date(tx.createdAt).toLocaleString(),
            officer: tx.creator ? `${tx.creator.firstName || ''} ${tx.creator.lastName || ''}`.trim() : 'Store Staff',
            destinationOrSource: destLabel,
            status: (tx.status?.toLowerCase() === 'pending' || tx.status?.toLowerCase() === 'cancelled') ? tx.status.toLowerCase() : 'completed',
            notes: tx.remarks || '',
            rawReferenceType: tx.referenceType || '',
          };
        });

        setTransactions(mapped);
      }
    } catch (err) {
      console.error('Failed to load stock transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((tx: any) => {
      // 1. Search Query (slip/reference, material/product, requisition/destination, officer, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          tx.reference?.toLowerCase().includes(q) ||
          tx.materialName?.toLowerCase().includes(q) ||
          tx.sku?.toLowerCase().includes(q) ||
          tx.destinationOrSource?.toLowerCase().includes(q) ||
          tx.officer?.toLowerCase().includes(q) ||
          tx.notes?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Destination Filter
      if (destinationFilter !== 'all') {
        const refType = (tx.rawReferenceType || '').toLowerCase();
        const destText = (tx.destinationOrSource || '').toLowerCase();
        const notesText = (tx.notes || '').toLowerCase();

        if (destinationFilter === 'line_1') {
          const isLine1 =
            refType === 'line_1' ||
            destText.includes('line 1') ||
            destText.includes('line_1') ||
            notesText.includes('line_1') ||
            notesText.includes('line 1');
          if (!isLine1) return false;
        } else if (destinationFilter === 'line_2') {
          const isLine2 =
            refType === 'line_2' ||
            destText.includes('line 2') ||
            destText.includes('line_2') ||
            notesText.includes('line_2') ||
            notesText.includes('line 2');
          if (!isLine2) return false;
        } else if (destinationFilter === 'filtration') {
          const isFiltration =
            refType === 'filtration' ||
            destText.includes('filtration') ||
            destText.includes('ro') ||
            notesText.includes('filtration');
          if (!isFiltration) return false;
        } else if (destinationFilter === 'packaging') {
          const isPackaging =
            refType === 'packaging' ||
            destText.includes('packaging') ||
            destText.includes('shrink') ||
            notesText.includes('packaging');
          if (!isPackaging) return false;
        } else if (destinationFilter === 'qc_lab') {
          const isQc =
            refType === 'qc_lab' ||
            destText.includes('qc') ||
            destText.includes('lab') ||
            destText.includes('quality') ||
            notesText.includes('qc_lab');
          if (!isQc) return false;
        } else {
          if (!refType.includes(destinationFilter) && !destText.includes(destinationFilter)) return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        if (tx.status !== statusFilter) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, destinationFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / 10) || 1;
  const paginatedTransactions = React.useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredTransactions.slice(start, start + 10);
  }, [filteredTransactions, currentPage]);

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

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !formQuantity) {
      showToast('Please select a product and enter quantity', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/stock-transactions', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          transactionType: 'STOCK_OUT',
          quantity: Number(formQuantity),
          referenceType: formDestination,
          referenceId: formRequisition || `OUT-${Date.now()}`,
          remarks: `${formDestination.toUpperCase()} Issuance. ${formReason}`,
        }),
      });

      if (res.ok) {
        showToast('Stock-OUT issued successfully!', 'success');
        setIsEntryModalOpen(false);
        setFormQuantity('');
        setFormRequisition('');
        setFormReason('');
        loadTransactions();
      } else {
        showToast(res.error || 'Failed to issue stock', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error recording stock-out', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Destination / Line"
                  value={destinationFilter}
                  onChange={(e) => {
                    setDestinationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={destinationOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Status Filter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
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
              transactions={paginatedTransactions}
              loading={isLoading}
              emptyText="No stock-out transactions found"
              emptyDescription="No outward material issuances match the selected filter criteria. Click 'Issue Materials (OUT)' to log a line transfer."
              onViewDetails={(item) => setSelectedTransaction(item)}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTransactions.length}
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
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Select Material / Product to Issue"
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} (${p.sku})`,
                  value: p.id,
                }))}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`Quantity to Issue (${products.find(p => p.id === productId)?.unit || 'Units'})`}
                required
                type="number"
                placeholder="0"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
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
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} leftIcon={<ArrowUpFromLine className="w-4 h-4" />}>
                {isSubmitting ? 'Authorizing...' : 'Authorize Issuance'}
              </Button>
            </div>
          </form>
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
