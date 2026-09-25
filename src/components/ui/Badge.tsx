import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({ children, className, variant = 'neutral', size = 'md', icon, ...props }: BadgeProps) {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full tracking-tight shrink-0';

  const variants = {
    primary: 'bg-orange-100 text-orange-950 border border-orange-300 font-bold',
    secondary: 'bg-gray-100 text-black border border-gray-300 font-semibold',
    success: 'bg-green-50 text-green-800 border border-green-300 font-semibold',
    warning: 'bg-orange-50 text-orange-800 border border-orange-300 font-semibold',
    danger: 'bg-red-50 text-red-800 border border-red-300 font-semibold',
    info: 'bg-gray-100 text-black border border-gray-300 font-semibold',
    neutral: 'bg-gray-50 text-gray-800 border border-gray-200 font-medium',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {icon && <span className="shrink-0 inline-flex">{icon}</span>}
      <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{children}</span>
    </span>
  );
}