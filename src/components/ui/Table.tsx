import { twMerge } from 'tailwind-merge';

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyText?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading,
  emptyText = 'No records found',
  className,
}: TableProps<T>) {
  return (
    <div className={twMerge('w-full overflow-x-auto border border-border rounded-card bg-surface shadow-erp', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-border text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {columns.map((col, idx) => (
              <th key={idx} className={twMerge('px-4 py-3.5', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm text-text-primary">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((_, cIdx) => (
                  <td key={cIdx} className="px-4 py-3.5">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted text-sm">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={keyExtractor(item)} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={twMerge('px-4 py-3.5 align-middle', col.className)}>
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? '')
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
