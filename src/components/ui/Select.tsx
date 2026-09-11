import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'h-10 px-3.5 text-sm bg-surface border border-border rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-colors',
            error && 'border-danger focus:ring-danger/40',
            className
          )}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs font-medium text-danger">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
