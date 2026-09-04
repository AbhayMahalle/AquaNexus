import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, className, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-[#172033] tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-[#94A3B8] pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white border border-[#E2E8F0] rounded-[8px] px-3.5 py-2 text-sm text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#1597D4] focus:ring-1 focus:ring-[#1597D4] transition-colors duration-150 disabled:bg-[#F5F8FB] disabled:cursor-not-allowed',
              icon && 'pl-9',
              error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]',
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-[#DC2626]">{error}</span>}
        {!error && helperText && (
          <span className="text-xs text-[#64748B]">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
