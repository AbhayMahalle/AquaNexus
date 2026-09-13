import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode | any;
  leftIcon?: React.ReactNode | any;
  rightIcon?: React.ReactNode | any;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading = false,
  disabled = false,
  icon,
  leftIcon,
  rightIcon,
  fullWidth = false,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg";
  
  const variants = {
    primary: "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xs focus:ring-[#F97316] active:bg-[#C2410C]",
    secondary: "bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#222222] border border-[#E5E5E5] focus:ring-[#666666] active:bg-[#E0E0E0]",
    accent: "bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xs focus:ring-[#F97316]",
    outline: "border border-[#E5E5E5] bg-white text-[#222222] hover:bg-[#F5F5F5] hover:border-[#D4D4D4] focus:ring-[#F97316]",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-xs focus:ring-[#DC2626]",
    ghost: "text-[#666666] hover:text-[#222222] hover:bg-[#F5F5F5] focus:ring-[#E5E5E5]",
    success: "bg-[#16A34A] hover:bg-[#15803D] text-white shadow-xs focus:ring-[#16A34A]",
    warning: "bg-[#F59E0B] hover:bg-[#D97706] text-white shadow-xs focus:ring-[#F59E0B]",
  };

  const sizes = {
    sm: "text-sm px-4 py-2 gap-2 font-medium",
    md: "text-sm px-5 py-2.5 gap-2 font-medium",
    lg: "text-base px-7 py-3 gap-2.5 font-semibold",
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading || isLoading}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading || isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (leftIcon || icon) ? (
        <span className="shrink-0">{leftIcon || icon}</span>
      ) : null}
      <span>{children}</span>
      {!(loading || isLoading) && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
