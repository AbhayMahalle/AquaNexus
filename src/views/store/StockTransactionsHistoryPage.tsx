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
  History,
  Search,
  FilterX,
  Package,
  Clock,
  Eye,
  RefreshCw,
  ArrowDownToLine,
  ArrowUpFromLine,
  RotateCcw,
  AlertTriangle,
  FileCheck2,
  TrendingDown,
  TrendingUp,
  Boxes
} from 'lucide-react';

export interface EnrichedTransaction {
  id: string;
  referenceId?: string;
  transactionType: string;
  quantity: number;
  product?: {
    id: string;
    sku: string;
    name: string;
    unit: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  referenceType?: string;
  status?: string;
  remarks?: string;
  createdAt: string;
}

export default function StockTransactionsHistoryPage() {
  const [transactions, setTransactions] = useState<EnrichedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedTx, setSelectedTx] = useState<EnrichedTransaction | null>(null);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams();
      if (typeFilter !== 'all') {
        q.append('transactionType', typeFilter);
      }
      q.append('page', String(currentPage));
      q.append('limit', '15');

      const res = await apiRequest<any>(`/api/stock-transactions?${q.toString()}`);
      if (res.ok && res.data) {
        const list = res.data.transactions || (Array.isArray(res.data) ? res.data : []);
        setTransactions(list);
        setTotalItems(res.data.pagination?.total || list.length);
        setTotalPages(res.data.pagination?.totalPages || Math.ceil(list.length / 15) || 1);
      }
    } catch (err) {
      console.error('Failed to load stock movements:', err);
      showToast('Failed to load stock movement ledger', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, currentPage]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const term = searchQuery.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchProd = t.product?.name?.toLowerCase().includes(term);
      const matchSku = t.product?.sku?.toLowerCase().includes(term);
      const matchRef = t.referenceId?.toLowerCase().includes(term);
      const matchType = t.transactionType?.toLowerCase().includes(term);
      const matchRemarks = t.remarks?.toLowerCase().includes(term);
      return matchProd || matchSku || matchRef || matchType || matchRemarks;
    });
  }, [transactions, searchQuery]);

  const columns: Column<EnrichedTransaction>[] = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{new Date(r.createdAt).toLocaleString()}</span>
        </div>
      ),
    },
    {
      key: 'referenceId',
      header: 'Reference #',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#0F4C81]">
          {r.referenceId || `TX-${r.id.slice(0, 8).toUpperCase()}`}
        </span>
      ),
    },
    {
      key: 'product',
      header: 'Product / Item',
      render: (r) => (
        <div>
          <span className="font-bold text-xs text-[#172033] block">{r.product?.name || 'Item'}</span>
          {r.product?.sku && <span className="font-mono text-[11px] text-[#64748B]">SKU: {r.product.sku}</span>}
        </div>
      ),
    },
    {
      key: 'transactionType',
      header: 'Movement Type',
      render: (r) => {
        const typeMap: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger' | 'neutral'; label: string }> = {
          STOCK_IN: { variant: 'success', label: 'STOCK IN' },
          PRODUCTION_RECEIPT: { variant: 'success', label: 'PRODUCTION GRN' },
          STOCK_OUT: { variant: 'info', label: 'STOCK OUT' },
          DISPATCH: { variant: 'info', label: 'DISPATCH' },
          RETURN: { variant: 'warning', label: 'RETURN' },
          DAMAGED: { variant: 'danger', label: 'DAMAGED LOSS' },
          ADJUSTMENT: { variant: 'neutral', label: 'ADJUSTMENT' },
        };
        const config = typeMap[r.transactionType] || { variant: 'neutral', label: r.transactionType };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      },
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => {
        const isDecrease = ['STOCK_OUT', 'DISPATCH', 'DAMAGED'].includes(r.transactionType);
        return (
          <span className={`font-mono font-bold text-xs ${isDecrease ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
            {isDecrease ? `-${r.quantity}` : `+${r.quantity}`} {r.product?.unit || 'Units'}
          </span>
        );
      },
    },
    {
      key: 'creator',
      header: 'Logged By',
      render: (r) => (
        <span className="text-xs text-[#172033]">
          {r.creator ? `${r.creator.firstName || ''} ${r.creator.lastName || ''}`.trim() : 'Store Staff'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedTx(r)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Stock Movement Ledger & Audit History"
          description="Complete chronological record of all warehouse receipts, issues, dispatches, write-offs, and adjustments."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Stock Transactions' }
          ]}
          secondaryActions={[
            {
              label: 'Manage Products',
              href: '/store/products',
              icon: <Boxes className="w-4 h-4" />,
            },
            {
              label: 'Stock Inward',
              href: '/store/stock-in',
              icon: <ArrowDownToLine className="w-4 h-4" />,
            },
            {
              label: 'Store Inventory',
              href: '/store/inventory',
              icon: <Package className="w-4 h-4" />,
            }
          ]}
        />

        {/* Filter Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Search Ledger Records"
                  placeholder="Search by Product Name, SKU, Slip #, or Remarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />}
                />
              </div>

              <div>
                <Select
                  label="Filter by Transaction Type"
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Transaction Types', value: 'all' },
                    { label: 'Stock Inward (STOCK_IN)', value: 'STOCK_IN' },
                    { label: 'Production Receipts (GRN)', value: 'PRODUCTION_RECEIPT' },
                    { label: 'Stock Outward (STOCK_OUT)', value: 'STOCK_OUT' },
                    { label: 'Dispatches (DISPATCH)', value: 'DISPATCH' },
                    { label: 'Returns (RETURN)', value: 'RETURN' },
                    { label: 'Damaged Write-offs (DAMAGED)', value: 'DAMAGED' },
                    { label: 'Audits & Adjustments (ADJUSTMENT)', value: 'ADJUSTMENT' },
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Showing <strong className="text-[#172033]">{totalItems}</strong> recorded stock movements
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setCurrentPage(1);
                  }}
                  leftIcon={<FilterX className="w-3.5 h-3.5" />}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadTransactions}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-[#0F4C81]" />
                  <span>Audit Trail Ledger</span>
                </CardTitle>
                <CardDescription>
                  Immutable transaction log preserving inventory integrity and traceability.
                </CardDescription>
              </div>
              <Badge variant="primary" size="sm">
                Audit Trail
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={filteredTransactions}
              loading={isLoading}
              emptyText="No stock transactions found"
              emptyDescription="No transactions match the selected filters."
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

        {/* Modal: View Details */}
        {selectedTx && (
          <Modal
            isOpen={!!selectedTx}
            onClose={() => setSelectedTx(null)}
            title={`Stock Movement Detail: ${selectedTx.referenceId || selectedTx.id.slice(0, 8)}`}
            description="Complete audit information for this stock change."
            footer={
              <Button variant="outline" size="sm" onClick={() => setSelectedTx(null)}>
                Close
              </Button>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block">Product</span>
                  <span className="font-bold text-[#172033]">{selectedTx.product?.name}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">SKU</span>
                  <span className="font-mono text-[#0F4C81]">{selectedTx.product?.sku}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Movement Type</span>
                  <span className="font-semibold text-[#172033]">{selectedTx.transactionType}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Quantity Changed</span>
                  <span className="font-mono font-bold text-[#172033]">{selectedTx.quantity} {selectedTx.product?.unit}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Recorded On</span>
                  <span>{new Date(selectedTx.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Staff Officer</span>
                  <span>{selectedTx.creator ? `${selectedTx.creator.firstName} ${selectedTx.creator.lastName}` : 'Store Staff'}</span>
                </div>
              </div>

              {selectedTx.remarks && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[#64748B] block mb-1">Remarks & Audit Notes:</span>
                  <p className="text-[#172033]">{selectedTx.remarks}</p>
                </div>
              )}
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
