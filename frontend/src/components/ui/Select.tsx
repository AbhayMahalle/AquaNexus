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
        {label && (
          <label className="text-xs font-semibold text-[#172033] tracking-wide">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={cn(
            'w-full bg-white border border-[#E2E8F0] rounded-[8px] px-3.5 py-2 text-sm text-[#172033] focus:outline-none focus:border-[#1597D4] focus:ring-1 focus:ring-[#1597D4] transition-colors duration-150',
            error && 'border-[#DC2626]',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-[#DC2626]">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
