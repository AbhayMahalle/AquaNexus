import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  emptyDescription?: string;
  onRowClick?: (row: T, index: number) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = 'No records found',
  emptyDescription = 'There is no data to display at this moment.',
  onRowClick,
  keyExtractor,
  className,
}: TableProps<T>) {
  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-sm", className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={cn(
                  "px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#64748B]",
                  getAlignmentClass(col.align),
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0] text-sm">
          {loading ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={`skel-row-${rIdx}`} className="animate-pulse">
                {columns.map((col) => (
                  <td key={`skel-cell-${col.key}`} className="px-4 py-3.5">
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-10 text-center">
                <EmptyState
                  icon={<Inbox className="w-8 h-8 text-[#94A3B8]" />}
                  title={emptyText}
                  description={emptyDescription}
                />
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => {
              const key = keyExtractor ? keyExtractor(row, rIdx) : row.id || rIdx;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row, rIdx)}
                  className={cn(
                    "transition-colors hover:bg-[#F8FAFC]",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={`${key}-${col.key}`}
                      className={cn(
                        "px-4 py-3.5 text-[#172033]",
                        getAlignmentClass(col.align),
                        col.className
                      )}
                    >
                      {col.render ? col.render(row, rIdx) : row[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function TableHeader({ children, className }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-[#F8FAFC] border-b border-[#E2E8F0]", className)}>{children}</thead>;
}

export function TableBody({ children, className }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-[#E2E8F0]", className)}>{children}</tbody>;
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("transition-colors hover:bg-[#F8FAFC]", className)} {...props}>{children}</tr>;
}

export function TableHead({ children, className }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#64748B] text-left", className)}>{children}</th>;
}

export function TableCell({ children, className }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 text-sm text-[#172033]", className)}>{children}</td>;
}
