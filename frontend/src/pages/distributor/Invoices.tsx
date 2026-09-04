import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { distributorService } from '@/services/distributorService';
import { Invoice } from '@/types/distributor';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getInvoices();
    if (res.success && res.data) {
      setInvoices(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  return (
    <DashboardLayout>
      <PageHeader
        title="Distributor Invoices"
        description="Official billing statements generated for restock orders fulfilled by the central plant."
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadInvoices} />
      ) : (
        <Table<Invoice>
          data={invoices}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Invoice Number', accessorKey: 'invoiceNumber', className: 'font-semibold text-[#0F4C81]' },
            { header: 'Issue Date', cell: (row) => formatDate(row.issueDate) },
            { header: 'Due Date', cell: (row) => formatDate(row.dueDate) },
            { header: 'Total Amount', cell: (row) => formatCurrency(row.amount) },
            { header: 'Amount Paid', cell: (row) => formatCurrency(row.paidAmount) },
            { header: 'Status', cell: (row) => <Badge status={row.status} /> },
            {
              header: 'Actions',
              cell: (row) => (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => alert(`Downloading Invoice ${row.invoiceNumber}`)}
                >
                  Download
                </Button>
              ),
            },
          ]}
        />
      )}
    </DashboardLayout>
  );
};
