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

  // Inward Entry Form state
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; unit: string }[]>([]);
  const [formQuantity, setFormQuantity] = useState('');
  const [formSource, setFormSource] = useState('supplier');
  const [formReference, setFormReference] = useState('');
  const [formBin, setFormBin] = useState('');
  const [formNotes, setFormNotes] = useState('');
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

  // Load Stock In transactions
  const loadTransactions = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      q.append('transactionType', 'STOCK_IN');
      q.append('page', '1');
      q.append('limit', '100');
      const res = await apiRequest<any>(`/api/stock-transactions?${q.toString()}`);
      if (res.ok && res.data) {
        const list = res.data.transactions || (Array.isArray(res.data) ? res.data : []);
        const mapped: StockTransaction[] = list.map((tx: any) => {
          let sourceLabel = 'Vendor Delivery';
          const refType = (tx.referenceType || '').toLowerCase();
          if (refType === 'supplier') sourceLabel = 'Supplier / Vendor Consignment';
          else if (refType === 'grn' || refType === 'goodsreceived') sourceLabel = 'Goods Received Note (GRN)';
          else if (refType === 'production_return') sourceLabel = 'Production Plant Return';
          else if (refType === 'transfer') sourceLabel = 'Inter-warehouse Transfer';
          else if (tx.referenceType) sourceLabel = tx.referenceType;

          const refInRemarks = tx.remarks?.match(/\[Ref:\s*([^\]]+)\]/)?.[1];

          return {
            id: tx.id,
            reference: tx.referenceId || refInRemarks || tx.id.slice(0, 8).toUpperCase(),
            materialName: tx.product?.name || 'Unknown Item',
            sku: tx.product?.sku || '--',
            transactionType: 'IN',
            quantity: tx.quantity,
            unit: tx.product?.unit || 'Units',
            date: new Date(tx.createdAt).toLocaleString(),
            officer: tx.creator ? `${tx.creator.firstName || ''} ${tx.creator.lastName || ''}`.trim() : 'Store Staff',
            destinationOrSource: sourceLabel,
            status: (tx.status?.toLowerCase() === 'pending' || tx.status?.toLowerCase() === 'flagged') ? tx.status.toLowerCase() : 'completed',
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
      // 1. Search Query (slip/reference, item/product, supplier/source, officer, notes)
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

      // 2. Inward Source Dropdown
      if (sourceFilter !== 'all') {
        const refType = (tx.rawReferenceType || '').toLowerCase();
        const sourceText = (tx.destinationOrSource || '').toLowerCase();
        const notesText = (tx.notes || '').toLowerCase();

        if (sourceFilter === 'supplier') {
          const isSupplier =
            refType === 'supplier' ||
            sourceText.includes('supplier') ||
            sourceText.includes('vendor') ||
            sourceText.includes('consignment') ||
            notesText.includes('supplier');
          if (!isSupplier) return false;
        } else if (sourceFilter === 'grn') {
          const isGrn =
            refType === 'grn' ||
            refType === 'goodsreceived' ||
            sourceText.includes('grn') ||
            sourceText.includes('goods received') ||
            notesText.includes('grn');
          if (!isGrn) return false;
        } else if (sourceFilter === 'production_return') {
          const isReturn =
            refType === 'production_return' ||
            sourceText.includes('return') ||
            notesText.includes('return');
          if (!isReturn) return false;
        } else if (sourceFilter === 'transfer') {
          const isTransfer =
            refType === 'transfer' ||
            sourceText.includes('transfer') ||
            notesText.includes('transfer');
          if (!isTransfer) return false;
        } else {
          if (!refType.includes(sourceFilter) && !sourceText.includes(sourceFilter)) return false;
        }
      }

      // 3. Status Filter
      if (statusFilter !== 'all') {
        if (tx.status !== statusFilter) return false;
      }

      return true;
    });
  }, [transactions, searchQuery, sourceFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / 10) || 1;
  const paginatedTransactions = React.useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredTransactions.slice(start, start + 10);
  }, [filteredTransactions, currentPage]);

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
          transactionType: 'STOCK_IN',
          quantity: Number(formQuantity),
          referenceType: formSource,
          referenceId: formReference || `IN-${Date.now()}`,
          remarks: `${formSource.toUpperCase()} Receipt. Bin: ${formBin || 'N/A'}. ${formNotes}`,
        }),
      });

      if (res.ok) {
        showToast('Stock-IN recorded successfully!', 'success');
        setIsEntryModalOpen(false);
        setFormQuantity('');
        setFormReference('');
        setFormBin('');
        setFormNotes('');
        loadTransactions();
      } else {
        showToast(res.error || 'Failed to record stock-in', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error recording stock-in', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Inward Source"
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
                    label="Status Filter"
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
              transactions={paginatedTransactions}
              loading={isLoading}
              emptyText="No stock-in transactions found"
              emptyDescription="No inward transactions match the selected filter criteria. Click 'New Stock-IN Entry' to log a received shipment."
              onViewDetails={(item) => setSelectedTransaction(item)}
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTransactions.length}
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
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Select Product / Material"
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} (${p.sku})`,
                  value: p.id,
                }))}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={`Quantity Received (${products.find(p => p.id === productId)?.unit || 'Units'})`}
                required
                type="number"
                placeholder="0"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
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
              <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} leftIcon={<ArrowDownToLine className="w-4 h-4" />}>
                {isSubmitting ? 'Saving...' : 'Save Inward Record'}
              </Button>
            </div>
          </form>
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
