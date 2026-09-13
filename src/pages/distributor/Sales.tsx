import React, { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { apiClient } from '@/lib/api-client';
import { Sale } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const DistributorSales: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    async function loadSales() {
      const res = await apiClient.getSales();
      if (res.success) setSales(res.data);
    }
    loadSales();
  }, []);

  const columns: Column<Sale>[] = [
    {
      header: 'Sale #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.saleNumber}</span>,
    },
    {
      header: 'Customer / Retailer',
      accessor: (row) => <span className="font-semibold text-textPrimary">{row.customerName}</span>,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Distributor Sales History"
        description="Records of product sales to supermarkets, retail stores, and commercial buyers in authorized area."
        breadcrumb={['AquaNexus', 'Distributor', 'Sales']}
      />

      <Table columns={columns} data={sales} searchPlaceholder="Search sales by customer or number..." />
    </div>
  );
};
