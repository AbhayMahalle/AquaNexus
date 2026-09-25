'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, DollarSign, RefreshCw, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { OutstandingSummary, Invoice } from '@/types/business';
import { formatCurrency } from '@/lib/utils';

export const AccountantOutstanding: React.FC = () => {
  const [summary, setSummary] = useState<OutstandingSummary | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Collect Payment Modal
  const [selectedDistributorId, setSelectedDistributorId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, invRes] = await Promise.all([
        apiClient.getOutstandingSummary(),
        apiClient.getInvoices(),
      ]);

      if (sumRes.success) setSummary(sumRes.data);
      if (invRes.success) setInvoices(invRes.data);
    } catch (err) {
      console.error('Failed to load outstanding dues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCollectModal = (distributorId: string) => {
    setSelectedDistributorId(distributorId);
    setErrorMsg('');
    const distInvoices = invoices.filter(
      (i) => i.distributorId === distributorId && (i.outstandingAmount || 0) > 0
    );
    if (distInvoices.length > 0) {
      setSelectedInvoiceId(distInvoices[0].id);
      setAmount(distInvoices[0].outstandingAmount || distInvoices[0].totalAmount);
    } else {
      setSelectedInvoiceId('');
      setAmount(0);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId || amount <= 0) {
      setErrorMsg('Please select a valid invoice and enter amount');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.recordPayment({
        invoiceId: selectedInvoiceId,
        amount: Number(amount),
        paymentMethod: paymentMethod as any,
        referenceId: referenceNumber.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        payerName: 'Distributor Agency',
        paymentType: 'DISTRIBUTOR_PAYMENT',
      });

      if (res.success) {
        setSelectedDistributorId(null);
        setReferenceNumber('');
        await loadData();
      } else {
        setErrorMsg(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<OutstandingSummary['distributorBalances'][0]>[] = [
    {
      header: 'Distributor Entity',
      accessor: (row) => (
        <div>
          <p className="font-bold text-textPrimary">{row.distributorName}</p>
          <p className="text-xs text-textMuted">Territory: {row.salesArea}</p>
        </div>
      ),
    },
    {
      header: 'Invoices Count',
      accessor: (row) => <span className="text-xs font-semibold text-textSecondary">{row.invoiceCount} Bills</span>,
    },
    {
      header: 'Total Billed',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatCurrency(row.totalAmount)}</span>,
    },
    {
      header: 'Collections Paid',
      accessor: (row) => <span className="text-xs text-success">{formatCurrency(row.paidAmount)}</span>,
    },
    {
      header: 'Net Outstanding',
      accessor: (row) => (
        <span className={`font-extrabold ${row.outstandingAmount > 0 ? 'text-danger' : 'text-emerald-600'}`}>
          {formatCurrency(row.outstandingAmount)}
        </span>
      ),
    },
    {
      header: 'Overdue Aging',
      accessor: (row) => (
        <Badge variant={row.overdueDays > 0 ? 'danger' : row.outstandingAmount > 0 ? 'warning' : 'success'}>
          {row.overdueDays > 0 ? `${row.overdueDays} Days Overdue` : row.outstandingAmount > 0 ? 'Due within terms' : 'Current'}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: (row) => (
        <Button
          size="sm"
          variant={row.outstandingAmount > 0 ? 'primary' : 'secondary'}
          disabled={row.outstandingAmount <= 0}
          onClick={() => openCollectModal(row.distributorId)}
          icon={CreditCard}
        >
          {row.outstandingAmount > 0 ? 'Collect Dues' : 'Settled'}
        </Button>
      ),
    },
  ];

  const pendingDistInvoices = selectedDistributorId
    ? invoices.filter((i) => i.distributorId === selectedDistributorId && (i.outstandingAmount || 0) > 0)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Outstanding Financial Dues"
        description="Comprehensive audit of distributor receivables aging and vendor supplier payables."
        breadcrumb={['AquaNexus', 'Accountant', 'Outstanding']}
        action={
          <Button variant="secondary" onClick={loadData} isLoading={isLoading} icon={RefreshCw}>
            Refresh
          </Button>
        }
      />

      {/* Dual Financial Receivables vs Payables Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-surface border border-border">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-textSecondary">
              <AlertCircle size={18} className="text-warning" /> Total Distributor Receivables
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <h3 className="text-3xl font-extrabold text-danger">
              {formatCurrency(summary?.totalDistributorOutstanding || 0)}
            </h3>
            <p className="text-xs text-textMuted mt-1">
              {summary?.overdueCount || 0} invoices currently overdue past payment deadline
            </p>
          </CardContent>
        </Card>

        <Card className="bg-surface border border-border">
          <CardHeader className="pb-0">
            <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-textSecondary">
              <DollarSign size={18} className="text-primary" /> Total Supplier Payables Dues
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <h3 className="text-3xl font-extrabold text-textPrimary">
              {formatCurrency(summary?.totalSupplierOutstanding || 0)}
            </h3>
            <p className="text-xs text-textMuted mt-1">
              Outstanding bills due to raw material and packaging vendors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distributor Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Distributor Receivables Aging Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table
            columns={columns}
            data={summary?.distributorBalances || []}
            isLoading={isLoading}
            searchable={false}
            emptyMessage="No distributor balances recorded."
          />
        </CardContent>
      </Card>

      {/* Collect Payment Modal */}
      {selectedDistributorId && (
        <Modal
          isOpen={!!selectedDistributorId}
          onClose={() => setSelectedDistributorId(null)}
          title="Collect Distributor Receivable Dues"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {errorMsg && (
              <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
                {errorMsg}
              </div>
            )}

            {pendingDistInvoices.length === 0 ? (
              <p className="text-xs text-textSecondary py-4">No open invoices with outstanding dues for this distributor.</p>
            ) : (
              <>
                <Select
                  label="Select Unpaid Invoice"
                  options={pendingDistInvoices.map((inv) => ({
                    label: `${inv.invoiceNumber} - Due: ${formatCurrency(inv.outstandingAmount || inv.totalAmount)}`,
                    value: inv.id,
                  }))}
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = pendingDistInvoices.find((i) => i.id === e.target.value);
                    if (inv) setAmount(inv.outstandingAmount || inv.totalAmount);
                  }}
                />

                <Input
                  label="Payment Amount (₹)"
                  type="number"
                  min="1"
                  value={amount || ''}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  required
                />

                <Select
                  label="Payment Instrument / Method"
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
              </>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
              <Button type="button" variant="secondary" onClick={() => setSelectedDistributorId(null)}>
                Cancel
              </Button>
              {pendingDistInvoices.length > 0 && (
                <Button type="submit" isLoading={isSubmitting} icon={CreditCard}>
                  Post Collection
                </Button>
              )}
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AccountantOutstanding;
