import React, { useEffect, useState } from 'react';
import { Plus, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { ProductReturn, Product } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorReturns: React.FC = () => {
  const [returnsList, setReturnsList] = useState<ProductReturn[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState<'DAMAGED' | 'EXPIRED' | 'EXCESS' | 'DEFECTIVE'>('DAMAGED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [retRes, prodRes] = await Promise.all([
        apiClient.getReturns(),
        apiClient.getProducts(),
      ]);
      if (retRes.success) setReturnsList(retRes.data);
      if (prodRes.success && prodRes.data.length > 0) {
        setProducts(prodRes.data);
        setSelectedProductId(prodRes.data[0].id);
      }
    }
    loadData();
  }, []);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const prod = products.find(p => p.id === selectedProductId);

    const res = await apiClient.createReturn({
      distributorId: 'dist-01',
      distributorName: 'AquaFlow Distribution',
      productId: selectedProductId,
      productName: prod ? prod.name : 'Water Product',
      quantity,
      reason,
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
      const updated = await apiClient.getReturns();
      if (updated.success) setReturnsList(updated.data);
    }
  };

  const columns: Column<ProductReturn>[] = [
    {
      header: 'Return #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.returnNumber}</span>,
    },
    {
      header: 'Product Name',
      accessor: (row) => <span className="font-semibold text-textPrimary">{row.productName}</span>,
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
        description="Track damaged, expired, or excess goods returned back to central plant store."
        breadcrumb={['AquaNexus', 'Distributor', 'Returns']}
        action={
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Submit Return Request
          </Button>
        }
      />

      <Table columns={columns} data={returnsList} searchPlaceholder="Search returns..." />

      {/* Return Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Submit Product Return Request"
      >
        <form onSubmit={handleReturnSubmit} className="space-y-4">
          <Select
            label="Select Return Product"
            options={products.map(p => ({ label: p.name, value: p.id }))}
            value={selectedProductId}
            onChange={e => setSelectedProductId(e.target.value)}
          />
          <Input
            label="Returned Quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={e => setQuantity(parseInt(e.target.value) || 1)}
            required
          />
          <Select
            label="Return Reason"
            options={[
              { label: 'Damaged Packaging / Seal Defect', value: 'DAMAGED' },
              { label: 'Expired Best Before Date', value: 'EXPIRED' },
              { label: 'Excess Delivery Stock', value: 'EXCESS' },
              { label: 'Quality Non-Conformity', value: 'DEFECTIVE' },
            ]}
            value={reason}
            onChange={e => setReason(e.target.value as any)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} icon={RotateCcw}>
              Submit Return
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
