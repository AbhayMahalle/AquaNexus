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

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  required = false,
  options,
  placeholder,
  className,
  disabled,
  id,
  value,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-xs font-semibold text-[#222222] uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          value={value}
          disabled={disabled}
          className={cn(
            "w-full appearance-none rounded-lg border bg-white px-3.5 py-2 pr-10 text-sm text-[#222222] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[#F5F5F5] disabled:text-[#999999] disabled:cursor-not-allowed",
            error 
              ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20" 
              : "border-[#E5E5E5] hover:border-[#D4D4D4] focus:border-[#F97316] focus:ring-[#F97316]/20",
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
        <div className="absolute right-3 text-[#666666] pointer-events-none flex items-center">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error ? (
        <p className="text-xs text-[#DC2626] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#666666]">{helperText}</p>
      ) : null}
    </div>
  );
});

Select.displayName = 'Select';
