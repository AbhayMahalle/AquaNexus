'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, CreditCard, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { Invoice } from '@/types/business';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [distributorInfo, setDistributorInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Pay Invoice Modal State
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CASH'>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const [res, distRes] = await Promise.all([
        apiClient.getInvoices(),
        apiClient.getDistributors(),
      ]);
      if (res.success) setInvoices(res.data);
      if (distRes.success && distRes.data.length > 0) {
        setDistributorInfo(distRes.data[0]);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setPaymentError('');

    if (paymentAmount <= 0) {
      setPaymentError('Payment amount must be greater than zero');
      return;
    }
    if (paymentAmount > payingInvoice.outstandingAmount) {
      setPaymentError(`Payment amount cannot exceed outstanding amount of ${formatCurrency(payingInvoice.outstandingAmount)}`);
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await apiClient.recordPayment({
        invoiceId: payingInvoice.id,
        invoiceNumber: payingInvoice.invoiceNumber,
        amount: Number(paymentAmount),
        paymentMethod: paymentMethod as any,
        referenceId: referenceNumber.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        notes: paymentNotes || 'Invoice Settlement',
        payerName: payingInvoice.distributorName || 'Distributor Agency',
        paymentType: 'DISTRIBUTOR_PAYMENT',
      });

      if (res.success) {
        setPayingInvoice(null);
        await loadInvoices();
      } else {
        setPaymentError(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred while saving payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.invoiceNumber}</span>,
    },
    {
      header: 'Order #',
      accessor: (row) => <span className="font-mono text-xs text-textSecondary">{row.orderNumber}</span>,
    },
    {
      header: 'Issue Date',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.issueDate)}</span>,
    },
    {
      header: 'Due Date',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.dueDate)}</span>,
    },
    {
      header: 'Total Amount',
      accessor: (row) => <span className="font-bold text-textPrimary">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      header: 'Outstanding',
      accessor: (row) => (
        <span className={`font-bold ${row.outstandingAmount > 0 ? 'text-danger' : 'text-success'}`}>
          {formatCurrency(row.outstandingAmount)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge
          variant={
            row.status === 'PAID'
              ? 'success'
              : row.status === 'PARTIAL'
              ? 'info'
              : row.status === 'OVERDUE'
              ? 'danger'
              : 'warning'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setSelectedInvoice(row)}
            icon={Eye}
          >
            View
          </Button>
          {row.outstandingAmount > 0 && (
            <Button
              size="sm"
              onClick={() => {
                setPayingInvoice(row);
                setPaymentAmount(row.outstandingAmount);
                setReferenceNumber('');
                setPaymentNotes('');
                setPaymentError('');
              }}
              icon={CreditCard}
            >
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor Invoices"
        description="View generated billing invoices, payment statuses, and due dates."
        breadcrumb={['AquaNexus', 'Distributor', 'Invoices']}
      />

      <Table
        columns={columns}
        data={invoices}
        isLoading={loading}
        searchPlaceholder="Search invoices by number..."
      />

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" onClick={() => window.print()} icon={Download}>
                Print / Save PDF
              </Button>
              <Button onClick={() => setSelectedInvoice(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-bgMain rounded-xl border border-border flex justify-between">
              <div>
                <p className="font-extrabold text-primary text-base">AquaNexus Bottling Plant</p>
                <p className="text-textMuted mt-0.5">Central Processing Plant &amp; Distribution Dispatch Hub</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-textPrimary text-sm">{selectedInvoice.invoiceNumber}</p>
                <p className="text-textMuted">Order: {selectedInvoice.orderNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-2 border-y border-border">
              <div>
                <p className="font-bold text-textMuted uppercase">Billed To</p>
                <p className="font-semibold text-textPrimary text-sm">{selectedInvoice.distributorName}</p>
                <p className="text-textSecondary">
                  Territory: {distributorInfo?.salesArea?.name ? `${distributorInfo.salesArea.name} (${distributorInfo.salesArea.code})` : 'Authorized Distribution Zone'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-textMuted uppercase">Invoice Dates</p>
                <p className="text-textSecondary">Issue Date: {formatDate(selectedInvoice.issueDate)}</p>
                <p className="text-textSecondary font-semibold">Due Date: {formatDate(selectedInvoice.dueDate)}</p>
              </div>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between font-medium text-textSecondary">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedInvoice.subtotal)}</span>
              </div>
              <div className="flex justify-between font-medium text-textSecondary">
                <span>GST Tax (5%)</span>
                <span>{formatCurrency(selectedInvoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-textPrimary text-sm pt-2 border-t border-border">
                <span>Total Invoice Amount</span>
                <span className="text-primary">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-success font-semibold">
                <span>Paid Amount</span>
                <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-danger font-extrabold text-sm pt-1">
                <span>Outstanding Balance</span>
                <span>{formatCurrency(selectedInvoice.outstandingAmount)}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Pay Invoice Modal */}
      {payingInvoice && (
        <Modal
          isOpen={!!payingInvoice}
          onClose={() => setPayingInvoice(null)}
          title={`Pay Invoice — ${payingInvoice.invoiceNumber}`}
          maxWidth="md"
        >
          <form onSubmit={handlePayInvoice} className="space-y-4">
            {paymentError && (
              <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
                {paymentError}
              </div>
            )}

            <div className="p-3 bg-bgMain rounded-lg border border-border space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-textSecondary">Distributor:</span>
                <span className="font-semibold text-textPrimary">{payingInvoice.distributorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-textSecondary">Total Amount:</span>
                <span className="font-semibold">{formatCurrency(payingInvoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <span className="font-bold text-textPrimary">Outstanding Dues:</span>
                <span className="font-extrabold text-danger">{formatCurrency(payingInvoice.outstandingAmount)}</span>
              </div>
            </div>

            <div>
              <Input
                label="Payment Amount (₹)"
                type="number"
                min="1"
                max={payingInvoice.outstandingAmount}
                value={paymentAmount || ''}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                required
              />
              <span className="text-[11px] text-textSecondary mt-0.5 block">
                Max payable: {formatCurrency(payingInvoice.outstandingAmount)}
              </span>
            </div>

            <Select
              label="Payment Method"
              options={[
                { label: 'Bank Electronic Transfer (NEFT/RTGS/IMPS)', value: 'BANK_TRANSFER' },
                { label: 'Online UPI (GPay, PhonePe, Paytm)', value: 'UPI' },
                { label: 'Company Bank Cheque', value: 'CHEQUE' },
                { label: 'Direct Cash Payment', value: 'CASH' },
              ]}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
            />

            <Input
              label="Transaction Reference / Cheque No."
              placeholder="e.g. UTR-982348274 or CHQ-001234"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />

            <Input
              label="Payment Notes"
              placeholder="e.g. Invoice settlement"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
              <Button type="button" variant="secondary" onClick={() => setPayingInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingPayment} icon={CreditCard}>
                Confirm &amp; Record Payment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DistributorInvoices;
