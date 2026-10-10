'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiRequest, showToast } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  Tag,
} from 'lucide-react';

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Record Payment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    companyId: '',
    amount: '',
    currency: 'INR',
    paymentMethod: 'BANK_TRANSFER',
    paymentType: 'MANUAL',
    transactionRef: '',
    notes: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [payRes, compRes] = await Promise.all([
        apiRequest<any>('/platform/payments'),
        apiRequest<any>('/platform/companies'),
      ]);

      if (payRes.ok && payRes.data) {
        setPayments(payRes.data.payments || []);
      }
      if (compRes.ok && compRes.data) {
        setCompanies(compRes.data.organizations || compRes.data || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load payments', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openRecordModal = () => {
    setFormData({
      companyId: companies[0]?.id || '',
      amount: '',
      currency: 'INR',
      paymentMethod: 'BANK_TRANSFER',
      paymentType: 'MANUAL',
      transactionRef: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/platform/payments', {
        method: 'POST',
        body: JSON.stringify({
          companyId: formData.companyId,
          amount: Number(formData.amount),
          currency: formData.currency,
          paymentMethod: formData.paymentMethod,
          paymentType: formData.paymentType,
          transactionRef: formData.transactionRef,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        showToast('Subscription payment recorded successfully', 'success');
        setIsModalOpen(false);
        fetchData();
      } else {
        showToast(res.error || 'Failed to record payment', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error recording payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.companyName || '').toLowerCase().includes(term) ||
      (p.transactionRef || '').toLowerCase().includes(term) ||
      (p.paymentMethod || '').toLowerCase().includes(term)
    );
  });

  const columns: Column<any>[] = [
    {
      key: 'company',
      header: 'Company / Tenant',
      render: (p) => (
        <span className="font-bold text-black">{p.companyName}</span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      render: (p) => (
        <span className="font-extrabold text-black">
          {formatCurrency(p.amount)}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Payment Type',
      render: (p) => (
        <Badge variant={p.paymentType === 'GATEWAY' ? 'success' : 'neutral'} size="sm">
          {p.paymentType === 'GATEWAY' ? 'GATEWAY VERIFIED' : 'MANUALLY RECORDED'}
        </Badge>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (p) => (
        <span className="text-xs font-semibold text-gray-700">{p.paymentMethod}</span>
      ),
    },
    {
      key: 'ref',
      header: 'Reference No.',
      render: (p) => (
        <span className="font-mono text-xs text-gray-500">{p.transactionRef || '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge variant={p.status === 'COMPLETED' ? 'success' : 'warning'}>
          {p.status}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: 'Paid Date',
      render: (p) => (
        <span className="text-xs text-gray-500">
          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['super_admin']}>
      <DashboardLayout>
        <div className="text-black">
          <PageHeader
            title="Subscription Payments & Invoices"
            description="Audit all customer subscription receipts, manual payments, and gateway-confirmed transactions"
            breadcrumbs={[{ label: 'Platform' }, { label: 'Payments' }]}
            primaryAction={{
              label: 'Record Manual Payment',
              icon: <Plus className="w-4 h-4" />,
              onClick: openRecordModal,
            }}
          />

          <Card className="mb-6">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span>Subscription Payment Ledger ({filteredPayments.length})</span>
              </CardTitle>
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search company, reference..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={columns}
                data={filteredPayments}
                emptyText="No payments recorded yet"
                emptyDescription="Payments recorded for subscription renewals will appear here"
              />
            </CardContent>
          </Card>

          {/* Record Payment Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Record Subscription Payment"
            description="Manually record bank transfer, cheque, or offline subscription receipt"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleRecordSubmit} loading={isSubmitting}>
                  Save Payment Receipt
                </Button>
              </>
            }
          >
            <form onSubmit={handleRecordSubmit} className="space-y-4">
              <Select
                label="Customer Company"
                required
                value={formData.companyId}
                onChange={(e) => setFormData((f) => ({ ...f, companyId: e.target.value }))}
                options={companies.map((c) => ({ label: `${c.name} (${c.slug})`, value: c.id }))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Amount (₹)"
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="e.g. 2999"
                />

                <Select
                  label="Payment Method"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData((f) => ({ ...f, paymentMethod: e.target.value }))}
                  options={[
                    { label: 'Bank Transfer (NEFT/RTGS)', value: 'BANK_TRANSFER' },
                    { label: 'UPI / Direct', value: 'UPI' },
                    { label: 'Cheque', value: 'CHEQUE' },
                    { label: 'Cash', value: 'CASH' },
                    { label: 'Other', value: 'OTHER' },
                  ]}
                />
              </div>

              <Input
                label="Transaction Reference / Cheque No."
                value={formData.transactionRef}
                onChange={(e) => setFormData((f) => ({ ...f, transactionRef: e.target.value }))}
                placeholder="e.g. UTR12849182390 or CHQ-9921"
              />

              <Input
                label="Remarks / Notes"
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Annual renewal payment received via ICICI corporate bank"
              />
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
