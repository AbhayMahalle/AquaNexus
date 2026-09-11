import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-secondary/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg';

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover shadow-sm',
    secondary: 'bg-surface text-textPrimary border border-border hover:bg-bgMain hover:border-gray-300 shadow-sm',
    danger: 'bg-danger text-white hover:bg-red-700 shadow-sm',
    success: 'bg-success text-white hover:bg-green-700 shadow-sm',
    ghost: 'bg-transparent text-textSecondary hover:bg-bgMain hover:text-textPrimary',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 20,
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={iconSizes[size]} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={iconSizes[size]} />}
        </>
      )}
    </button>
  );
};
