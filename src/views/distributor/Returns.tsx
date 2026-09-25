'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Plus, RotateCcw, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { ProductReturn, Product, DistributorStock } from '@/types/business';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorReturns: React.FC = () => {
  const [returnsList, setReturnsList] = useState<ProductReturn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<DistributorStock[]>([]);
  const [distributorId, setDistributorId] = useState('');
  const [distributorName, setDistributorName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<'DAMAGED' | 'EXPIRED' | 'EXCESS' | 'DEFECTIVE'>('DAMAGED');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [retRes, prodRes, stockRes, distRes] = await Promise.all([
        apiClient.getReturns(),
        apiClient.getProducts(),
        apiClient.getDistributorStock(),
        apiClient.getDistributors(),
      ]);

      if (retRes.success) setReturnsList(retRes.data);
      if (prodRes.success && prodRes.data.length > 0) {
        setProducts(prodRes.data);
        if (!selectedProductId) setSelectedProductId(prodRes.data[0].id);
      }
      if (stockRes.success) setStock(stockRes.data);
      if (distRes.success && distRes.data.length > 0) {
        setDistributorId(distRes.data[0].id);
        setDistributorName(distRes.data[0].name);
      }
    } catch (err) {
      console.error('Failed to load returns data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);
    const prod = products.find((p) => p.id === selectedProductId);

    try {
      const res = await apiClient.createReturn({
        distributorId: distributorId || undefined,
        distributorName: distributorName || 'Distributor Agency',
        productId: selectedProductId,
        productName: prod ? prod.name : 'Water Product',
        quantity,
        reason,
        condition: reason === 'EXCESS' ? 'GOOD' : 'DAMAGED',
      });

      if (res.success) {
        setIsModalOpen(false);
        setQuantity(1);
        await loadData();
      } else {
        setErrorMsg(res.message || 'Failed to submit return');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalReturnsCount = returnsList.length;
  const totalUnitsReturned = useMemo(() => returnsList.reduce((acc, r) => acc + r.quantity, 0), [returnsList]);
  const pendingCount = useMemo(() => returnsList.filter((r) => r.status === 'PENDING').length, [returnsList]);
  const approvedCount = useMemo(() => returnsList.filter((r) => r.status === 'APPROVED').length, [returnsList]);
  const totalRefundAmount = useMemo(() => returnsList.reduce((acc, r) => acc + r.refundAmount, 0), [returnsList]);

  const filteredReturns = useMemo(() => {
    if (statusFilter === 'ALL') return returnsList;
    return returnsList.filter((r) => r.status === statusFilter);
  }, [returnsList, statusFilter]);

  const selectedStockItem = stock.find((s) => s.productId === selectedProductId);

  const columns: Column<ProductReturn>[] = [
    {
      header: 'Return #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.returnNumber}</span>,
    },
    {
      header: 'Product Name',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-textPrimary block">{row.productName}</span>
          <span className="text-xs text-textSecondary">{row.distributorName || distributorName}</span>
        </div>
      ),
    },
    {
      header: 'Returned Quantity',
      accessor: (row) => <span className="font-bold text-textPrimary">{row.quantity} Units</span>,
    },
    {
      header: 'Reason',
      accessor: (row) => <span className="text-xs font-medium text-textSecondary">{row.reason}</span>,
    },
    {
      header: 'Return Date',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.returnDate)}</span>,
    },
    {
      header: 'Refund Amount',
      accessor: (row) => <span className="font-bold text-primary">{formatCurrency(row.refundAmount)}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Returns Log"
        description="Live records of damaged, expired, or excess goods returned back to central plant store."
        breadcrumb={['AquaNexus', 'Distributor', 'Returns']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadData} isLoading={isLoading} icon={RefreshCw}>
              Refresh
            </Button>
            <Button
              onClick={() => {
                setErrorMsg('');
                setIsModalOpen(true);
              }}
              icon={Plus}
            >
              Submit Return Request
            </Button>
          </div>
        }
      />

      {/* Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Total Return Claims</p>
              <p className="text-xl font-bold text-textPrimary mt-1">{totalReturnsCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">{totalUnitsReturned} total units</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600">
              <RotateCcw className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Pending Review</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Awaiting plant verification</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Approved & Restocked</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Verified by plant store</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Refund Credit Issued</p>
              <p className="text-xl font-bold text-primary mt-1">{formatCurrency(totalRefundAmount)}</p>
              <p className="text-xs text-textSecondary mt-0.5">Credited to billing ledger</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'ALL' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('ALL')}
        >
          All Claims ({returnsList.length})
        </Button>
        <Button
          variant={statusFilter === 'PENDING' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={statusFilter === 'APPROVED' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('APPROVED')}
        >
          Approved ({approvedCount})
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredReturns}
        isLoading={isLoading}
        searchPlaceholder="Search returns by product or return number..."
        emptyMessage="No return claims filed. Products reported damaged or expired will appear here."
      />

      {/* Return Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit Product Return Request">
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">{errorMsg}</div>
          )}

          <Select
            label="Select Return Product"
            options={products.map((p) => {
              const st = stock.find((s) => s.productId === p.id);
              return {
                label: `${p.name} ${st ? `(In Stock: ${st.quantity})` : ''}`,
                value: p.id,
              };
            })}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          />

          <div>
            <Input
              label="Returned Quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
            {selectedStockItem && (
              <span className="text-xs text-textSecondary mt-1 block">
                Warehouse balance: {selectedStockItem.quantity} units ({selectedStockItem.unit})
              </span>
            )}
          </div>

          <Select
            label="Return Reason"
            options={[
              { label: 'Damaged Packaging / Seal Defect', value: 'DAMAGED' },
              { label: 'Expired Best Before Date', value: 'EXPIRED' },
              { label: 'Excess Delivery Stock', value: 'EXCESS' },
              { label: 'Quality Non-Conformity', value: 'DEFECTIVE' },
            ]}
            value={reason}
            onChange={(e) => setReason(e.target.value as any)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} icon={RotateCcw}>
              Submit Return Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DistributorReturns;
