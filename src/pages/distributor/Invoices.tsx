import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye, CreditCard, Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { Invoice } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      const res = await apiClient.getInvoices();
      if (res.success) setInvoices(res.data);
    }
    loadInvoices();
  }, []);

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
              onClick={() => navigate('/distributor/payments')}
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

      <Table columns={columns} data={invoices} searchPlaceholder="Search invoices..." />

      {/* Printable Invoice Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button variant="secondary" onClick={() => alert('Downloading PDF invoice...') } icon={Download}>
                Download PDF
              </Button>
              <Button onClick={() => setSelectedInvoice(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-bgMain rounded-xl border border-border flex justify-between">
              <div>
                <p className="font-extrabold text-primary text-base">AquaNexus Water Plant</p>
                <p className="text-textMuted mt-0.5">Central Bottling Plant & Distribution Hub</p>
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
                <p className="text-textSecondary">Authorized Sales Area: North Region</p>
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
    </div>
  );
};
