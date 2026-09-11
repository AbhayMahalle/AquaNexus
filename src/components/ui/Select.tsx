import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  helperText?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  error,
  helperText,
  className,
  id,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-[11px] font-bold tracking-wider text-text-secondary uppercase mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={twMerge(
          clsx(
            'w-full px-3 py-2 text-sm bg-surface text-text-primary border rounded-md shadow-xs appearance-none transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary',
            'disabled:bg-slate-100 disabled:text-text-muted disabled:cursor-not-allowed',
            error ? 'border-status-danger focus:ring-red-500/40' : 'border-border',
            className
          )
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-status-danger mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-secondary mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
