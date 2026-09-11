import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  required = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-xs font-semibold text-[#222222] uppercase tracking-wider"
        >
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-[#666666] pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={cn(
            "w-full rounded-lg border bg-white px-3.5 py-2 text-sm text-[#222222] placeholder-[#999999] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[#F5F5F5] disabled:text-[#999999] disabled:cursor-not-allowed",
            leftIcon ? "pl-10" : "pl-3.5",
            rightIcon ? "pr-10" : "pr-3.5",
            error 
              ? "border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20" 
              : "border-[#E5E5E5] hover:border-[#D4D4D4] focus:border-[#F97316] focus:ring-[#F97316]/20",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-[#666666] flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-[#DC2626] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#666666]">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
