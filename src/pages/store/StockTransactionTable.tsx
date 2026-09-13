import React from 'react';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Clock, Eye } from 'lucide-react';

export interface StockTransaction {
  id: string;
  reference: string;
  materialName: string;
  sku?: string;
  transactionType: 'IN' | 'OUT' | 'RETURN' | 'DAMAGE';
  quantity: string | number;
  unit: string;
  date: string;
  officer: string;
  destinationOrSource?: string;
  status: 'completed' | 'pending' | 'cancelled' | 'flagged';
  notes?: string;
}

export interface StockTransactionTableProps {
  transactions: StockTransaction[];
  loading?: boolean;
  emptyText?: string;
  emptyDescription?: string;
  onViewDetails?: (item: StockTransaction) => void;
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export function StockTransactionTable({
  transactions,
  loading = false,
  emptyText = 'No transactions recorded',
  emptyDescription = 'Transactions will appear here as entries are logged in the system.',
  onViewDetails,
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
}: StockTransactionTableProps) {
  const columns: Column<StockTransaction>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{r.date}</span>
        </div>
      )
    },
    {
      key: 'reference',
      header: 'Slip / Reference',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.reference}</span>
    },
    {
      key: 'materialName',
      header: 'Product / Material',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.materialName}</span>
          {r.sku && <span className="text-[11px] font-mono text-[#64748B]">SKU: {r.sku}</span>}
        </div>
      )
    },
    {
      key: 'transactionType',
      header: 'Type',
      render: (r) => {
        const typeVariants: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger'; label: string }> = {
          IN: { variant: 'success', label: 'STOCK IN' },
          OUT: { variant: 'info', label: 'STOCK OUT' },
          RETURN: { variant: 'warning', label: 'RETURN' },
          DAMAGE: { variant: 'danger', label: 'DAMAGE' },
        };
        const config = typeVariants[r.transactionType] || { variant: 'info', label: r.transactionType };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantity} {r.unit}
        </span>
      )
    },
    {
      key: 'destinationOrSource',
      header: 'Source / Destination',
      render: (r) => <span className="text-xs text-[#64748B]">{r.destinationOrSource || '--'}</span>
    },
    {
      key: 'officer',
      header: 'Store Officer',
      render: (r) => <span className="text-xs text-[#172033] font-medium">{r.officer}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusMap: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
          completed: { variant: 'success', label: 'COMPLETED' },
          pending: { variant: 'warning', label: 'PENDING' },
          cancelled: { variant: 'neutral', label: 'CANCELLED' },
          flagged: { variant: 'danger', label: 'FLAGGED' },
        };
        const config = statusMap[r.status] || { variant: 'neutral', label: r.status };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails && onViewDetails(r)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-3">
      <Table
        columns={columns}
        data={transactions}
        loading={loading}
        emptyText={emptyText}
        emptyDescription={emptyDescription}
      />

      {totalPages > 1 && onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={10}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
