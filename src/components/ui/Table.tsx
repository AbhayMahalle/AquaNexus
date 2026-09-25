import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';
import { Inbox, Search } from 'lucide-react';

export interface Column<T> {
  key?: string;
  header?: React.ReactNode;
  accessorKey?: keyof T | string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  cell?: (row: T) => React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  isLoading?: boolean;
  emptyText?: string;
  emptyDescription?: string;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  keyExtractor?: (row: T, index: number) => string | number;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (term: string) => void;
  pageSize?: number;
  className?: string;
}

function getCellValue<T>(row: T, col: Column<T>, index: number): React.ReactNode {
  if (col.render) return col.render(row, index);
  if (col.cell) return col.cell(row);
  if (typeof col.accessor === 'function') return col.accessor(row);
  const field = col.accessorKey ?? col.accessor ?? col.key;
  if (field == null) return '';
  return String((row as Record<string, unknown>)[field as string] ?? '');
}

function getRowKey<T>(row: T, col: string, index: number, keyExtractor?: (row: T, index: number) => string | number): string {
  if (keyExtractor) return String(keyExtractor(row, index));
  const id = (row as Record<string, unknown>).id;
  return id != null ? String(id) : `row-${index}-${col}`;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  isLoading = false,
  emptyText = 'No records found',
  emptyDescription = 'There is no data to display at this moment.',
  emptyMessage,
  onRowClick,
  keyExtractor,
  searchable,
  searchPlaceholder,
  onSearchChange,
  pageSize,
  className,
}: TableProps<T>) {
  const busy = loading || isLoading;

  const [internalTerm, setInternalTerm] = useState('');

  const showSearch = searchable ?? searchPlaceholder != null;
  const effectiveSearch = onSearchChange != null ? true : showSearch;
  const effectivePageSize = pageSize ?? (searchPlaceholder != null ? 8 : undefined);

  const filtered = useMemo(() => {
    if (!effectiveSearch) return data;
    const termValue = (onSearchChange ? '' : internalTerm).toLowerCase();
    if (termValue) {
      return data.filter((row) =>
        Object.values(row as Record<string, unknown>).some((val) =>
          String(val).toLowerCase().includes(termValue)
        )
      );
    }
    return data;
  }, [data, effectiveSearch, internalTerm, onSearchChange]);

  const [page, setPage] = useState(1);

  const visibleData = useMemo(() => {
    if (effectivePageSize == null) return filtered;
    const start = (page - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, effectivePageSize, page]);

  const totalPages = effectivePageSize != null ? Math.ceil(filtered.length / effectivePageSize) || 1 : 1;

  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const handleSearchChange = (term: string) => {
    setInternalTerm(term);
    setPage(1);
    onSearchChange?.(term);
  };

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-border bg-surface shadow-xs', className)}>
      {effectiveSearch && (
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder ?? 'Search records...'}
              value={internalTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-border rounded-lg text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>
        </div>
      )}
      <table className="w-full text-left border-collapse min-w-full">
        <thead>
          <tr className="bg-gray-100 border-b border-border">
            {columns.map((col) => (
              <th
                key={String(col.key ?? col.accessorKey ?? col.accessor?.toString() ?? col.header?.toString() ?? '')}
                style={{ width: col.width }}
                className={cn(
                  'px-4 py-3 text-xs font-bold uppercase tracking-wider text-black whitespace-nowrap align-middle',
                  getAlignmentClass(col.align),
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {busy ? (
            Array.from({ length: 4 }).map((_, rIdx) => (
              <tr key={`skel-row-${rIdx}`} className="animate-pulse">
                {columns.map((col) => {
                  const k = col.key ?? col.accessorKey?.toString() ?? `c${rIdx}`;
                  return (
                    <td key={`skel-cell-${k}`} className="px-4 py-3.5 align-middle">
                      <Skeleton className="h-4 w-3/4 rounded" />
                    </td>
                  );
                })}
              </tr>
            ))
          ) : visibleData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-10 text-center align-middle">
                <EmptyState
                  icon={<Inbox className="w-8 h-8 text-textMuted" />}
                  title={emptyText}
                  description={emptyMessage ?? emptyDescription}
                />
              </td>
            </tr>
          ) : (
            visibleData.map((row, rIdx) => {
              const key = getRowKey(row, 'row', rIdx, keyExtractor);
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick && onRowClick(row, rIdx)}
                  className={cn('transition-colors hover:bg-gray-100', onRowClick && 'cursor-pointer')}
                >
                  {columns.map((col) => {
                    const k = col.key ?? col.accessorKey?.toString() ?? col.accessor?.toString() ?? 'cell';
                    return (
                      <td
                        key={`${key}-${k}`}
                        className={cn(
                          'px-4 py-3.5 text-black align-middle whitespace-nowrap',
                          getAlignmentClass(col.align),
                          col.className
                        )}
                      >
                        {getCellValue(row, col, rIdx)}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      {effectivePageSize != null && totalPages > 1 && !busy && visibleData.length > 0 && (
        <div className="flex items-center justify-between gap-4 p-4 border-t border-border">
          <div className="text-xs text-textSecondary">
            Page{' '}
            <strong className="text-black font-semibold">
              {page}
            </strong>{' '}
            of <strong className="text-black font-semibold">{totalPages}</strong>{' '}
            ({filtered.length} records)
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 text-xs rounded-lg border border-border text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 text-xs rounded-lg border border-border text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function TableHeader({ children, className }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-gray-100 border-b border-border', className)}>{children}</thead>;
}

export function TableBody({ children, className }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-border', className)}>{children}</tbody>;
}

export function TableRow({ children, className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn('transition-colors hover:bg-gray-100', className)} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wider text-black text-left whitespace-nowrap align-middle', className)}>
      {children}
    </th>
  );
}

export function TableCell({ children, className }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3.5 text-sm text-black align-middle whitespace-nowrap', className)}>{children}</td>
  );
}