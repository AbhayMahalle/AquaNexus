import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, className, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">{label}</label>}
        <input
          ref={ref}
          className={cn(
            'h-10 px-3.5 text-sm bg-surface border border-border rounded-lg text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-colors',
            error && 'border-danger focus:ring-danger/40',
            className
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs font-medium text-danger">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-textMuted">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
