import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, required = false, leftIcon, rightIcon, icon, className, disabled, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const leading = leftIcon ?? icon;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-textPrimary uppercase tracking-wider">
            {label}
            {required && <span className="text-status-danger ml-1">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leading && (
            <div className="absolute left-3 text-textSecondary pointer-events-none flex items-center">
              <span className="inline-flex [&>svg]:w-4 [&>svg]:h-4">{leading}</span>
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={cn(
              'w-full rounded-lg border bg-surface px-3.5 py-2 text-sm text-textPrimary placeholder:text-textMuted transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-background disabled:text-textMuted disabled:cursor-not-allowed',
              leading ? 'pl-10' : 'pl-3.5',
              rightIcon ? 'pr-10' : 'pr-3.5',
              error
                ? 'border-status-danger focus:border-status-danger focus:ring-status-danger/20'
                : 'border-border hover:border-gray-400 focus:border-orange-500 focus:ring-orange-200',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-textSecondary flex items-center">
              <span className="inline-flex [&>svg]:w-4 [&>svg]:h-4">{rightIcon}</span>
            </div>
          )}
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

Input.displayName = 'Input';