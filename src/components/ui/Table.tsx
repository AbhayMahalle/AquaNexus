import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from './Input';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchable?: boolean;
  onSearchChange?: (term: string) => void;
  pageSize?: number;
  emptyMessage?: string;
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  searchPlaceholder = 'Search records...',
  searchable = true,
  pageSize = 8,
  emptyMessage = 'No records found matching criteria',
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter records locally if search term is active
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return Object.values(item as Record<string, unknown>).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-border flex items-center justify-between gap-4">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-bgMain border border-border rounded-lg text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-secondary/40"
            />
          </div>
          <div className="text-xs text-textSecondary">
            Showing <span className="font-semibold">{paginatedData.length}</span> of{' '}
            <span className="font-semibold">{filteredData.length}</span> entries
          </div>
        </div>
      )}

      {paginatedData.length === 0 ? (
        <div className="py-8">
          <EmptyState title="No records found" description={emptyMessage} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-bgMain border-b border-border text-textSecondary text-xs uppercase font-semibold">
              <tr>
                {columns.map((col, idx) => (
                  <th key={idx} className={`px-4 py-3.5 ${col.className || ''}`}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} className="hover:bg-bgMain/60 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3.5 text-textPrimary ${col.className || ''}`}>
                      {typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="text-xs text-textSecondary">
            Page <span className="font-semibold">{currentPage}</span> of{' '}
            <span className="font-semibold">{totalPages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-border rounded-md text-textSecondary hover:bg-bgMain disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-border rounded-md text-textSecondary hover:bg-bgMain disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
