'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { DollarSign, Plus, RefreshCw, ArrowDownLeft, ArrowUpRight, CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { Payment, Expense, PayrollRecord, Invoice } from '@/types/business';
import { formatCurrency, formatDate } from '@/lib/utils';

interface UnifiedPaymentRecord {
  id: string;
  paymentNumber: string;
  entityName: string;
  referenceId: string;
  paymentMethod: string;
  paymentDate: string;
  amount: number;
  type: 'DISTRIBUTOR_PAYMENT' | 'SUPPLIER_PAYMENT' | 'SALARY_PAYMENT';
  status: string;
}

export const AccountantPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'DISTRIBUTOR_PAYMENT' | 'SUPPLIER_PAYMENT' | 'SALARY_PAYMENT'>('DISTRIBUTOR_PAYMENT');

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'UPI' | 'CASH' | 'CHEQUE'>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [payRes, expRes, payrRes, invRes] = await Promise.all([
        apiClient.getPayments(),
        apiClient.getExpenses(),
        apiClient.getPayroll(),
        apiClient.getInvoices(),
      ]);

      if (payRes.success) setPayments(payRes.data);
      if (expRes.success) setExpenses(expRes.data);
      if (payrRes.success) setPayroll(payrRes.data);
      if (invRes.success) {
        setInvoices(invRes.data);
        const openInv = invRes.data.find((i) => (i.outstandingAmount || 0) > 0);
        if (openInv) {
          setSelectedInvoiceId(openInv.id);
          setAmount(openInv.outstandingAmount || openInv.totalAmount);
        }
      }
    } catch (err) {
      console.error('Failed to load payments data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (amount <= 0) {
      setErrorMsg('Payment amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.recordPayment({
        invoiceId: selectedInvoiceId,
        amount: Number(amount),
        paymentMethod: paymentMethod as any,
        referenceId: referenceNumber.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        notes,
        payerName: 'Distributor Agency',
        paymentType: 'DISTRIBUTOR_PAYMENT',
      });

      if (res.success) {
        setIsModalOpen(false);
        setReferenceNumber('');
        setNotes('');
        await loadData();
      } else {
        setErrorMsg(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build unified records
  const distributorInflow: UnifiedPaymentRecord[] = useMemo(() => {
    return payments.map((p) => ({
      id: p.id,
      paymentNumber: p.paymentNumber,
      entityName: p.payerName || 'Distributor Agency',
      referenceId: p.referenceId,
      paymentMethod: p.paymentMethod,
      paymentDate: p.paymentDate,
      amount: p.amount,
      type: 'DISTRIBUTOR_PAYMENT',
      status: p.status,
    }));
  }, [payments]);

  const supplierOutflow: UnifiedPaymentRecord[] = useMemo(() => {
    return expenses.map((e) => ({
      id: e.id,
      paymentNumber: e.expenseNumber,
      entityName: e.description ? `${e.category.replace(/_/g, ' ')} - ${e.description}` : e.category.replace(/_/g, ' '),
      referenceId: `EXP-${e.id.slice(0, 8)}`,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: e.expenseDate,
      amount: e.amount,
      type: 'SUPPLIER_PAYMENT',
      status: e.status === 'PAID' || e.status === 'APPROVED' ? 'PAID' : 'PENDING',
    }));
  }, [expenses]);

  const salaryOutflow: UnifiedPaymentRecord[] = useMemo(() => {
    return payroll.map((p) => ({
      id: p.id,
      paymentNumber: `SAL-${p.id.slice(0, 8)}`,
      entityName: `${p.employeeName} (${p.department})`,
      referenceId: `PAYROLL-${p.payPeriod}`,
      paymentMethod: 'DIRECT_DEBIT',
      paymentDate: p.paidDate || new Date().toISOString().split('T')[0],
      amount: p.netSalary,
      type: 'SALARY_PAYMENT',
      status: p.status,
    }));
  }, [payroll]);

  // Overall financial sums
  const totalInflow = useMemo(() => distributorInflow.reduce((acc, p) => acc + p.amount, 0), [distributorInflow]);
  const totalSupplierOutflow = useMemo(() => supplierOutflow.reduce((acc, p) => acc + p.amount, 0), [supplierOutflow]);
  const totalSalaryOutflow = useMemo(
    () => salaryOutflow.filter((p) => p.status === 'PAID').reduce((acc, p) => acc + p.amount, 0),
    [salaryOutflow]
  );
  const netCashFlow = totalInflow - (totalSupplierOutflow + totalSalaryOutflow);

  const displayedList = useMemo(() => {
    if (activeTab === 'DISTRIBUTOR_PAYMENT') return distributorInflow;
    if (activeTab === 'SUPPLIER_PAYMENT') return supplierOutflow;
    return salaryOutflow;
  }, [activeTab, distributorInflow, supplierOutflow, salaryOutflow]);

  const columns: Column<UnifiedPaymentRecord>[] = [
    {
      header: 'Payment #',
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
          {row.paymentNumber}
        </span>
      ),
    },
    {
      header: 'Entity / Counterparty',
      accessor: (row) => <span className="font-semibold text-textPrimary">{row.entityName}</span>,
    },
    {
      header: 'Reference ID',
      accessor: (row) => <span className="font-mono text-xs text-textSecondary">{row.referenceId}</span>,
    },
    {
      header: 'Method',
      accessor: (row) => (
        <span className="text-xs text-textSecondary font-medium">{row.paymentMethod.replace(/_/g, ' ')}</span>
      ),
    },
    {
      header: 'Date',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.paymentDate)}</span>,
    },
    {
      header: 'Amount',
      accessor: (row) => (
        <span className={`font-extrabold ${row.type === 'DISTRIBUTOR_PAYMENT' ? 'text-success' : 'text-danger'}`}>
          {row.type === 'DISTRIBUTOR_PAYMENT' ? '+' : '-'}
          {formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'PAID' || row.status === 'COMPLETED' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Financial Payments Portal"
        description="Unified portal for distributor incoming collections, supplier outgoing payouts, and employee salary disbursements."
        breadcrumb={['AquaNexus', 'Accountant', 'Payments']}
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
              Record Incoming Payment
            </Button>
          </div>
        }
      />

      {/* Live Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Incoming Collections</p>
              <p className="text-xl font-bold text-success mt-1">+{formatCurrency(totalInflow)}</p>
              <p className="text-xs text-textSecondary mt-0.5">{distributorInflow.length} distributor payments</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Supplier Payouts</p>
              <p className="text-xl font-bold text-danger mt-1">-{formatCurrency(totalSupplierOutflow)}</p>
              <p className="text-xs text-textSecondary mt-0.5">{supplierOutflow.length} expense vouchers</p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Salary Disbursements</p>
              <p className="text-xl font-bold text-danger mt-1">-{formatCurrency(totalSalaryOutflow)}</p>
              <p className="text-xs text-textSecondary mt-0.5">Disbursed payroll funds</p>
            </div>
            <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Net Cash Flow</p>
              <p className={`text-xl font-bold mt-1 ${netCashFlow >= 0 ? 'text-primary' : 'text-danger'}`}>
                {netCashFlow >= 0 ? '+' : ''}
                {formatCurrency(netCashFlow)}
              </p>
              <p className="text-xs text-textSecondary mt-0.5">Net operational balance</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {[
          { label: `Distributor Collections (${distributorInflow.length})`, value: 'DISTRIBUTOR_PAYMENT' },
          { label: `Supplier Payouts (${supplierOutflow.length})`, value: 'SUPPLIER_PAYMENT' },
          { label: `Salary Disbursements (${salaryOutflow.length})`, value: 'SALARY_PAYMENT' },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setActiveTab(tab.value as any)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Table
        columns={columns}
        data={displayedList}
        isLoading={isLoading}
        searchPlaceholder="Search payments by entity or payment #..."
        emptyMessage="No payment records found for this category."
      />

      {/* Record Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Incoming Distributor Payment">
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">{errorMsg}</div>
          )}

          <Select
            label="Select Billed Invoice"
            options={invoices.map((inv) => ({
              label: `${inv.invoiceNumber} - ${inv.distributorName} (Dues: ${formatCurrency(inv.outstandingAmount || inv.totalAmount)})`,
              value: inv.id,
            }))}
            value={selectedInvoiceId}
            onChange={(e) => {
              setSelectedInvoiceId(e.target.value);
              const inv = invoices.find((i) => i.id === e.target.value);
              if (inv) setAmount(inv.outstandingAmount || inv.totalAmount);
            }}
          />

          <div>
            <Input
              label="Settlement Amount (₹)"
              type="number"
              min="1"
              max={selectedInvoice ? selectedInvoice.outstandingAmount || selectedInvoice.totalAmount : undefined}
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              required
            />
            {selectedInvoice && (
              <span className="text-xs text-textSecondary mt-1 block">
                Total Invoice Outstanding: {formatCurrency(selectedInvoice.outstandingAmount || selectedInvoice.totalAmount)}
              </span>
            )}
          </div>

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

          <Input
            label="Payment Notes"
            placeholder="e.g. Received via State Bank of India"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} icon={CreditCard}>
              Confirm &amp; Post Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountantPayments;
