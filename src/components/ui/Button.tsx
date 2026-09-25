import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'link' | 'orange';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode | LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

function renderIcon(icon: React.ReactNode | LucideIcon | undefined): React.ReactNode {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-4 h-4 shrink-0" aria-hidden="true" />;
  }
  return <span className="shrink-0 inline-flex items-center">{icon}</span>;
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const busy = loading || isLoading;

  const variants: Record<string, string> = {
    primary:
      'bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30 shadow-sm focus-visible:ring-orange-500/30 active:bg-gray-300',
    orange:
      'bg-orange-500 text-black font-bold hover:bg-gray-200 border border-orange-600/30 shadow-sm focus-visible:ring-orange-500/30 active:bg-gray-300',
    secondary:
      'bg-white text-black border border-gray-300 hover:bg-gray-100 hover:text-black shadow-xs focus-visible:ring-gray-300',
    accent: 'bg-orange-600 text-black font-bold hover:bg-gray-200 shadow-xs focus-visible:ring-orange-500/30',
    outline:
      'bg-white text-black border border-gray-300 hover:bg-gray-100 hover:text-black focus-visible:ring-gray-300',
    ghost: 'bg-transparent text-gray-800 hover:bg-gray-100 hover:text-black',
    danger: 'bg-status-danger text-white hover:bg-red-700 shadow-xs focus-visible:ring-status-danger/30',
    success: 'bg-status-success text-white hover:bg-green-700 shadow-xs focus-visible:ring-status-success/30',
    warning: 'bg-status-warning text-white hover:bg-amber-600 shadow-xs focus-visible:ring-status-warning/30',
    link: 'bg-transparent text-orange-600 hover:text-orange-700 underline-offset-4 hover:underline p-0 h-auto font-semibold',
  };

  const sizes: Record<string, string> = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-10 px-4 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
    icon: 'h-9 w-9 p-0',
  };

  const leading = iconPosition === 'left' ? renderIcon(icon) : leftIcon;
  const trailing = iconPosition === 'right' ? renderIcon(icon) : rightIcon;

  return (
    <button
      type={type}
      disabled={disabled || busy}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg',
        fullWidth && 'w-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {busy && <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />}
      {!busy && leading}
      {children != null && <span className="inline-flex items-center gap-1.5 whitespace-nowrap">{children}</span>}
      {!busy && trailing}
    </button>
  );
}

Button.displayName = 'Button';