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
  CheckCircle2,
  Boxes,
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function StockInPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<StockTransaction | null>(null);

  // Inward Entry Form state
  const [productId, setProductId] = useState('');
  const [products, setProducts] = useState<{ id: string; name: string; sku: string; unit: string; category?: string }[]>([]);
  const [formQuantity, setFormQuantity] = useState('');
  const [formSource, setFormSource] = useState('supplier');
  const [formReference, setFormReference] = useState('');
  const [formBin, setFormBin] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Product Inline Modal state
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Finished Goods');
  const [newProdUnit, setNewProdUnit] = useState('Bottle');
  const [newProdCostPrice, setNewProdCostPrice] = useState('');
  const [newProdSellingPrice, setNewProdSellingPrice] = useState('');
  const [newProdMinStock, setNewProdMinStock] = useState('10');
  const [newProdDescription, setNewProdDescription] = useState('');
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  // API state
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load products list from real database
  const loadProducts = useCallback(async () => {
    try {
      const res = await apiRequest<any>('/api/products?limit=200');
      if (res.ok && res.data) {
        const list = res.data.products || (Array.isArray(res.data) ? res.data : res.data.data || []);
        setProducts(list);
        if (list.length > 0) {
          setProductId((prev) => (prev && list.some((p: any) => p.id === prev) ? prev : list[0].id));
        }
      }
    } catch (err) {
      console.error('Failed to load products for stock-in:', err);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Load Stock In transactions
  const loadTransactions = useCallback(async () => {
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
      console.error('Failed to load stock in transactions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Open New Product Modal
  const handleOpenNewProductModal = () => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setNewProdSku(`PRD-${randomSuffix}`);
    setNewProdName('');
    setNewProdCategory('Finished Goods');
    setNewProdUnit('Bottle');
    setNewProdCostPrice('');
    setNewProdSellingPrice('');
    setNewProdMinStock('10');
    setNewProdDescription('');
    setIsNewProductModalOpen(true);
  };

  // Submit New Product
  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdSku.trim() || !newProdName.trim() || !newProdSellingPrice || !newProdCostPrice) {
      showToast('SKU, Name, Selling Price, and Cost Price are required', 'error');
      return;
    }

    const sPrice = parseFloat(newProdSellingPrice);
    const cPrice = parseFloat(newProdCostPrice);
    const minStock = parseInt(newProdMinStock, 10);

    if (isNaN(sPrice) || sPrice < 0 || isNaN(cPrice) || cPrice < 0) {
      showToast('Prices must be non-negative numbers', 'error');
      return;
    }

    setIsCreatingProduct(true);
    try {
      const res = await apiRequest<any>('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: newProdSku.trim(),
          name: newProdName.trim(),
          description: newProdDescription.trim() || undefined,
          category: newProdCategory.trim(),
          unit: newProdUnit.trim(),
          sellingPrice: sPrice,
          costPrice: cPrice,
          minimumStock: isNaN(minStock) ? 0 : minStock,
          status: 'ACTIVE',
        }),
      });

      if (res.ok && res.data) {
        const created = res.data.product || res.data;
        showToast(`Product "${created.name}" created and selected!`, 'success');

        // Immediately update products list and select new product
        await loadProducts();
        setProductId(created.id);
        setIsNewProductModalOpen(false);
      } else {
        showToast(res.error || 'Failed to create product', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating product', 'error');
    } finally {
      setIsCreatingProduct(false);
    }
  };

  // Submit Inward Stock Entry
  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) {
      showToast('Please select a product or create a new product', 'error');
      return;
    }

    const qty = parseInt(formQuantity, 10);
    if (!formQuantity || isNaN(qty) || qty <= 0) {
      showToast('Quantity received must be a valid positive integer greater than 0', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/stock-transactions', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          transactionType: 'STOCK_IN',
          quantity: qty,
          referenceType: formSource,
          referenceId: formReference.trim() || `IN-${Date.now()}`,
          remarks: `${formSource.toUpperCase()} Receipt. Bin: ${formBin || 'N/A'}. ${formNotes}`,
        }),
      });

      if (res.ok) {
        showToast('Stock-IN recorded successfully! Inventory has been updated.', 'success');
        setIsEntryModalOpen(false);
        setFormQuantity('');
        setFormReference('');
        setFormBin('');
        setFormNotes('');
        await loadTransactions();
      } else {
        showToast(res.error || 'Failed to record stock-in', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error recording stock-in', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesRef = t.reference?.toLowerCase().includes(query);
        const matchesMat = t.materialName?.toLowerCase().includes(query);
        const matchesSku = t.sku?.toLowerCase().includes(query);
        const matchesOfficer = t.officer?.toLowerCase().includes(query);
        const matchesNotes = t.notes?.toLowerCase().includes(query);

        if (!matchesRef && !matchesMat && !matchesSku && !matchesOfficer && !matchesNotes) {
          return false;
        }
      }

      if (sourceFilter !== 'all') {
        const raw = (t.rawReferenceType || '').toLowerCase();
        const dest = (t.destinationOrSource || '').toLowerCase();
        if (sourceFilter === 'supplier' && !raw.includes('supplier') && !dest.includes('supplier')) return false;
        if (sourceFilter === 'grn' && !raw.includes('grn') && !dest.includes('grn') && !dest.includes('goods received')) return false;
        if (sourceFilter === 'production_return' && !raw.includes('return') && !dest.includes('return')) return false;
      }

      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, sourceFilter, statusFilter]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage]);

  const selectedProdObj = products.find((p) => p.id === productId);

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
              label: 'Manage Products',
              href: '/store/products',
              icon: <Boxes className="w-4 h-4" />,
            },
            {
              label: 'Goods Received (GRN)',
              href: '/store/goods-received',
              icon: <FileCheck2 className="w-4 h-4" />,
            },
            {
              label: 'Current Inventory',
              href: '/store/inventory',
              icon: <Package className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'New Stock-IN Entry',
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
                  label="Search Inward History"
                  placeholder="Search by PO#, Reference, Material name, or SKU..."
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
                  label="Filter by Inward Source"
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Inward Sources', value: 'all' },
                    { label: 'Vendor / Supplier Delivery', value: 'supplier' },
                    { label: 'Goods Received Note (GRN)', value: 'grn' },
                    { label: 'Production Line Return', value: 'production_return' },
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
                    { label: 'Completed', value: 'completed' },
                    { label: 'Pending Verification', value: 'pending' },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Showing <strong className="text-[#172033]">{filteredTransactions.length}</strong> recorded inward entries
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

        {/* Stock Ledger Table */}
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
            {/* Product Selection with Inline "+ New Product" Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-[#172033]">
                  Select Product / Material <span className="text-[#DC2626]">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleOpenNewProductModal}
                  className="inline-flex items-center gap-1 text-xs text-[#0F4C81] hover:text-[#0c3c66] font-semibold bg-[#F0F7FF] px-2.5 py-1 rounded-lg border border-[#BAE6FD] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ New Product</span>
                </button>
              </div>

              <Select
                required
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} (${p.sku}) - ${p.category || 'General'}`,
                  value: p.id,
                }))}
              />

              {selectedProdObj && (
                <div className="mt-2 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#64748B]">Selected SKU:</span>{' '}
                    <strong className="font-mono text-[#0F4C81]">{selectedProdObj.sku}</strong>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Unit:</span>{' '}
                    <strong className="text-[#172033]">{selectedProdObj.unit}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <Input
                label={`Quantity Received (${selectedProdObj?.unit || 'Units'})`}
                required
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="PO / Invoice / Challan #"
                required
                placeholder="e.g. PO-2026-0901"
                value={formReference}
                onChange={(e) => setFormReference(e.target.value)}
              />

              <Input
                label="Storage Bin / Location"
                placeholder="e.g. Warehouse Rack B-04"
                value={formBin}
                onChange={(e) => setFormBin(e.target.value)}
                leftIcon={<Building2 className="w-4 h-4" />}
              />
            </div>

            <div>
              <Input
                label="Remarks / Batch Details"
                placeholder="e.g. Supplier Lot #9482, quality seals verified"
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
                leftIcon={<ArrowDownToLine className="w-4 h-4" />}
              >
                {isSubmitting ? 'Recording...' : 'Save Inward Record'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Create New Product Inline */}
        <Modal
          isOpen={isNewProductModalOpen}
          onClose={() => setIsNewProductModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[#0F4C81]" />
              <span>Create New Product for Stock In</span>
            </div>
          }
          description="Register a new item. Once created, it will be immediately selected for stock inward entry."
          size="lg"
        >
          <form onSubmit={handleCreateProductSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Product SKU / Code"
                required
                placeholder="e.g. PRD-500ML-CAP"
                value={newProdSku}
                onChange={(e) => setNewProdSku(e.target.value)}
              />

              <Input
                label="Product Name"
                required
                placeholder="e.g. 500ml Tamper-Evident Caps"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Category"
                required
                placeholder="e.g. Caps & Closures, Bottles, Chemicals"
                value={newProdCategory}
                onChange={(e) => setNewProdCategory(e.target.value)}
              />

              <Input
                label="Unit of Measurement"
                required
                placeholder="e.g. Jar, Bottle, Carton, Box, Piece"
                value={newProdUnit}
                onChange={(e) => setNewProdUnit(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Cost Price (₹)"
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newProdCostPrice}
                onChange={(e) => setNewProdCostPrice(e.target.value)}
                leftIcon={<DollarSign className="w-3.5 h-3.5 text-[#64748B]" />}
              />

              <Input
                label="Selling Price (₹)"
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newProdSellingPrice}
                onChange={(e) => setNewProdSellingPrice(e.target.value)}
                leftIcon={<DollarSign className="w-3.5 h-3.5 text-[#64748B]" />}
              />

              <Input
                label="Minimum Stock Level"
                type="number"
                placeholder="10"
                value={newProdMinStock}
                onChange={(e) => setNewProdMinStock(e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Description"
                placeholder="e.g. Standard blue food-grade screw cap for 500ml water bottles"
                value={newProdDescription}
                onChange={(e) => setNewProdDescription(e.target.value)}
              />
            </div>

            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-xs text-[#166534]">
              <Sparkles className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>
                After creation, this product will be immediately selected in your Stock In form and available across all modules.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setIsNewProductModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isCreatingProduct}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {isCreatingProduct ? 'Creating...' : 'Create & Select Product'}
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
                  <span className="font-bold font-mono text-[#172033]">
                    {selectedTransaction.quantity} {selectedTransaction.unit}
                  </span>
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

              {selectedTransaction.notes && (
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs">
                  <span className="text-[#64748B] block mb-1">Remarks & Details:</span>
                  <span className="text-[#172033]">{selectedTransaction.notes}</span>
                </div>
              )}
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
