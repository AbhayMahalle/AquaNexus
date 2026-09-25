import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, required = false, options, placeholder, className, disabled, id, value, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-textPrimary uppercase tracking-wider">
            {label}
            {required && <span className="text-status-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            value={value}
            disabled={disabled}
            className={cn(
              'w-full appearance-none rounded-lg border bg-surface px-3.5 py-2 pr-10 text-sm text-textPrimary transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-background disabled:text-textMuted disabled:cursor-not-allowed',
              error
                ? 'border-status-danger focus:border-status-danger focus:ring-status-danger/20'
                : 'border-border hover:border-gray-400 focus:border-orange-500 focus:ring-orange-200',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected={!value}>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 text-textSecondary pointer-events-none flex items-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs text-status-danger font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-textSecondary">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';