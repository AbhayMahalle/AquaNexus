'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Plus, RefreshCw, ShoppingBag, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { Sale, DistributorStock } from '@/types/business';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorSales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stock, setStock] = useState<DistributorStock[]>([]);
  const [distributorId, setDistributorId] = useState<string>('');
  const [distributorName, setDistributorName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Record Sale Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [salesRes, stockRes, distRes] = await Promise.all([
        apiClient.getSales(),
        apiClient.getDistributorStock(),
        apiClient.getDistributors(),
      ]);

      if (salesRes.success) setSales(salesRes.data);
      if (stockRes.success) {
        setStock(stockRes.data);
        if (stockRes.data.length > 0 && !selectedProductId) {
          setSelectedProductId(stockRes.data[0].productId);
        }
      }
      if (distRes.success && distRes.data.length > 0) {
        setDistributorId(distRes.data[0].id);
        setDistributorName(distRes.data[0].name);
      }
    } catch (err) {
      console.error('Failed to load sales data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const currentStockItem = stock.find((s) => s.productId === selectedProductId);
    if (!currentStockItem || currentStockItem.quantity < quantity) {
      setErrorMsg(`Insufficient stock. You only have ${currentStockItem?.quantity || 0} units available.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createSale({
        distributorId: distributorId || undefined,
        customerReference: customerName.trim() || 'Retail Customer',
        items: [
          {
            productId: selectedProductId,
            quantity: Number(quantity),
          },
        ],
      });

      if (res.success) {
        setIsModalOpen(false);
        setCustomerName('');
        setQuantity(1);
        await loadData();
      } else {
        setErrorMsg(res.message || 'Failed to record sale');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics calculation
  const totalSalesRevenue = useMemo(() => sales.reduce((acc, s) => acc + s.totalAmount, 0), [sales]);
  const paidSalesCount = useMemo(() => sales.filter((s) => s.paymentStatus === 'PAID').length, [sales]);
  const pendingSalesCount = useMemo(
    () => sales.filter((s) => s.paymentStatus === 'PENDING' || s.paymentStatus === 'PARTIAL').length,
    [sales]
  );
  const totalUnitsInStock = useMemo(() => stock.reduce((acc, s) => acc + s.quantity, 0), [stock]);

  const filteredSales = useMemo(() => {
    if (statusFilter === 'ALL') return sales;
    if (statusFilter === 'PAID') return sales.filter((s) => s.paymentStatus === 'PAID');
    return sales.filter((s) => s.paymentStatus === 'PENDING' || s.paymentStatus === 'PARTIAL');
  }, [sales, statusFilter]);

  const columns: Column<Sale>[] = [
    {
      header: 'Sale #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.saleNumber}</span>,
    },
    {
      header: 'Customer / Retailer',
      accessor: (row) => (
        <div>
          <span className="font-semibold text-textPrimary block">{row.customerName}</span>
          <span className="text-xs text-textSecondary">{row.distributorName || distributorName}</span>
        </div>
      ),
    },
    {
      header: 'Sale Date',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.saleDate)}</span>,
    },
    {
      header: 'Amount Sold',
      accessor: (row) => <span className="font-bold text-textPrimary">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      header: 'Payment Status',
      accessor: (row) => (
        <Badge variant={row.paymentStatus === 'PAID' ? 'success' : row.paymentStatus === 'PARTIAL' ? 'info' : 'warning'}>
          {row.paymentStatus}
        </Badge>
      ),
    },
  ];

  const selectedStockItem = stock.find((s) => s.productId === selectedProductId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor Sales History"
        description="Live records of product sales to supermarkets, retail stores, and commercial buyers in authorized territory."
        breadcrumb={['AquaNexus', 'Distributor', 'Sales']}
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
              Record Direct Sale
            </Button>
          </div>
        }
      />

      {/* Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Total Sales Revenue</p>
              <p className="text-xl font-bold text-textPrimary mt-1">{formatCurrency(totalSalesRevenue)}</p>
              <p className="text-xs text-textSecondary mt-0.5">Across {sales.length} logged sales</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Total Transactions</p>
              <p className="text-xl font-bold text-textPrimary mt-1">{sales.length}</p>
              <p className="text-xs text-textSecondary mt-0.5">Distributor customer sales</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Settled / Paid</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{paidSalesCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Fully collected</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Available Stock to Sell</p>
              <p className="text-xl font-bold text-primary mt-1">{totalUnitsInStock} Units</p>
              <p className="text-xs text-textSecondary mt-0.5">Across {stock.length} inventory SKUs</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
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
          All Sales ({sales.length})
        </Button>
        <Button
          variant={statusFilter === 'PAID' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('PAID')}
        >
          Settled Paid ({paidSalesCount})
        </Button>
        <Button
          variant={statusFilter === 'PENDING' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending / Partial ({pendingSalesCount})
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredSales}
        isLoading={isLoading}
        searchPlaceholder="Search sales by customer or sale number..."
        emptyMessage="No sales recorded yet. Use 'Record Direct Sale' to log your first customer delivery."
      />

      {/* Record Direct Sale Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Direct Customer Sale">
        <form onSubmit={handleCreateSale} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">{errorMsg}</div>
          )}

          <Select
            label="Product From Live Distributor Stock"
            options={stock.map((s) => ({
              label: `${s.productName} (${s.quantity} available in warehouse)`,
              value: s.productId,
            }))}
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            disabled={stock.length === 0}
          />

          {stock.length === 0 && (
            <p className="text-xs text-amber-600">
              You currently have 0 stock. Please wait for central plant dispatch or place a stock replenishment order first.
            </p>
          )}

          <Input
            label="Customer / Retail Store Name"
            type="text"
            placeholder="e.g. Apex Hypermarket, Metro Stores"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />

          <div>
            <Input
              label="Quantity to Sell"
              type="number"
              min="1"
              max={selectedStockItem ? selectedStockItem.quantity : undefined}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
            />
            {selectedStockItem && (
              <span className="text-xs text-textSecondary mt-1 block">
                Available: {selectedStockItem.quantity} units ({selectedStockItem.unit})
              </span>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={stock.length === 0 || (selectedStockItem ? selectedStockItem.quantity < quantity : true)}
              icon={ShoppingBag}
            >
              Record & Deduct Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DistributorSales;
