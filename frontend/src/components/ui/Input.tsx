import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-[11px] font-bold tracking-wider text-text-secondary uppercase mb-1.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3 text-text-muted pointer-events-none">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'w-full text-sm bg-surface text-text-primary border rounded-md shadow-xs transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary',
              'placeholder:text-text-muted disabled:bg-slate-100 disabled:text-text-muted disabled:cursor-not-allowed',
              icon ? 'pl-9 pr-3 py-2' : 'px-3 py-2',
              error ? 'border-status-danger focus:ring-red-500/40' : 'border-border',
              className
            )
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-status-danger mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-text-secondary mt-1">{helperText}</p>
      ) : null}
    </div>
  );
};
