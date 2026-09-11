import React, { useEffect, useState } from 'react';
import { CreditCard, Plus, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { Payment, Invoice, PaymentMethod } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ONLINE_UPI');
  const [referenceId, setReferenceId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [payRes, invRes] = await Promise.all([
        apiClient.getPayments(),
        apiClient.getInvoices(),
      ]);
      if (payRes.success) setPayments(payRes.data);
      if (invRes.success) {
        setInvoices(invRes.data);
        const unpaid = invRes.data.find(i => i.outstandingAmount > 0);
        if (unpaid) {
          setSelectedInvoiceId(unpaid.id);
          setAmount(unpaid.outstandingAmount);
        }
      }
    }
    loadData();
  }, []);

  const handleMakePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const inv = invoices.find(i => i.id === selectedInvoiceId);

    const res = await apiClient.recordPayment({
      invoiceId: selectedInvoiceId,
      invoiceNumber: inv ? inv.invoiceNumber : '',
      referenceId: referenceId || `TXN-${Date.now()}`,
      payerName: 'AquaFlow Distribution (North Zone)',
      paymentType: 'DISTRIBUTOR_PAYMENT',
      paymentMethod,
      amount,
      notes: 'Distributor Online Settlement',
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
      const [pRes, iRes] = await Promise.all([apiClient.getPayments(), apiClient.getInvoices()]);
      if (pRes.success) setPayments(pRes.data);
      if (iRes.success) setInvoices(iRes.data);
    }
  };

  const columns: Column<Payment>[] = [
    {
      header: 'Payment #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.paymentNumber}</span>,
    },
    {
      header: 'Linked Invoice',
      accessor: (row) => <span className="font-mono text-xs text-textSecondary">{row.invoiceNumber || '-'}</span>,
    },
    {
      header: 'Txn Reference ID',
      accessor: (row) => <span className="font-mono text-xs font-medium text-textPrimary">{row.referenceId}</span>,
    },
    {
      header: 'Payment Method',
      accessor: (row) => <span className="text-xs font-semibold text-textSecondary">{row.paymentMethod.replace('_', ' ')}</span>,
    },
    {
      header: 'Date',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.paymentDate)}</span>,
    },
    {
      header: 'Amount Paid',
      accessor: (row) => <span className="font-bold text-success">{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => <Badge variant={row.status === 'PAID' ? 'success' : 'info'}>{row.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor Payment Transactions"
        description="Records of payments transferred to plant central bank accounts."
        breadcrumb={['AquaNexus', 'Distributor', 'Payments']}
        action={
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Make Payment
          </Button>
        }
      />

      <Table columns={columns} data={payments} searchPlaceholder="Search payment transactions..." />

      {/* Payment Settlement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Make Invoice Settlement Payment"
      >
        <form onSubmit={handleMakePayment} className="space-y-4">
          <Select
            label="Select Pending Invoice"
            options={invoices.map(i => ({
              label: `${i.invoiceNumber} (Outstanding: ${formatCurrency(i.outstandingAmount)})`,
              value: i.id,
            }))}
            value={selectedInvoiceId}
            onChange={e => {
              const idVal = e.target.value;
              setSelectedInvoiceId(idVal);
              const inv = invoices.find(i => i.id === idVal);
              if (inv) setAmount(inv.outstandingAmount);
            }}
          />
          <Input
            label="Payment Amount (₹)"
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            required
          />
          <Select
            label="Payment Transfer Method"
            options={[
              { label: 'UPI Instant Transfer', value: 'ONLINE_UPI' },
              { label: 'NEFT / RTGS Bank Transfer', value: 'BANK_TRANSFER' },
              { label: 'Bank Cheque', value: 'CHEQUE' },
              { label: 'Cash Settlement', value: 'CASH' },
            ]}
            value={paymentMethod}
            onChange={e => setPaymentMethod(e.target.value as any)}
          />
          <Input
            label="Transaction Reference / UTR Number"
            placeholder="e.g. UPI-99201948201 or NEFT Ref"
            value={referenceId}
            onChange={e => setReferenceId(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} icon={CheckCircle2}>
              Submit Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
