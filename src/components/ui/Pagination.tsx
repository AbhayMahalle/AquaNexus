import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  pageSize,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const perPage = itemsPerPage ?? pageSize;
  const startItem = totalItems && perPage ? (currentPage - 1) * perPage + 1 : undefined;
  const endItem = totalItems && perPage ? Math.min(currentPage * perPage, totalItems) : undefined;

  return (
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-3 border-t border-border px-2', className)}>
      <div className="text-xs text-textSecondary">
        {startItem && endItem && totalItems ? (
          <span>
            Showing <strong className="text-textPrimary font-semibold">{startItem}</strong> to{' '}
            <strong className="text-textPrimary font-semibold">{endItem}</strong> of{' '}
            <strong className="text-textPrimary font-semibold">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="text-textPrimary font-semibold">{currentPage}</strong> of{' '}
            <strong className="text-textPrimary font-semibold">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="h-8 px-2.5 text-xs"
        >
          Previous
        </Button>

        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const page = idx + 1;
            if (page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1) {
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    'h-8 min-w-8 px-2 rounded-lg text-xs font-semibold transition-colors',
                    page === currentPage
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-textSecondary hover:bg-background hover:text-textPrimary'
                  )}
                >
                  {page}
                </button>
              );
            }
            if ((page === 2 && currentPage > 3) || (page === totalPages - 1 && currentPage < totalPages - 2)) {
              return (
                <span key={page} className="text-textMuted text-xs px-1">
                  ...
                </span>
              );
            }
            return null;
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="h-8 px-2.5 text-xs"
        >
          Next
        </Button>
      </div>
    </div>
  );
}