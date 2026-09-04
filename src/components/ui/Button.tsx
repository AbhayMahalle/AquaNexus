import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-lg";
  
  const variants = {
    primary: "bg-[#0F4C81] hover:bg-[#0C3C68] text-white shadow-sm focus:ring-[#0F4C81] active:bg-[#0A3052]",
    secondary: "bg-[#1597D4] hover:bg-[#117EB2] text-white shadow-sm focus:ring-[#1597D4] active:bg-[#0F6F9D]",
    accent: "bg-[#22B8CF] hover:bg-[#1BA0B5] text-white shadow-sm focus:ring-[#22B8CF]",
    outline: "border border-[#E2E8F0] bg-white text-[#172033] hover:bg-[#F5F8FB] hover:border-[#CBD5E1] focus:ring-[#0F4C81]",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-sm focus:ring-[#DC2626]",
    ghost: "text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FB] focus:ring-[#0F4C81]",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5 gap-1.5 font-medium",
    md: "text-sm px-4 py-2 gap-2 font-medium",
    lg: "text-base px-6 py-2.5 gap-2.5 font-semibold",
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
