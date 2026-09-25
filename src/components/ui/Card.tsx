import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: 'default' | 'outline' | 'subtle' | 'ghost' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  title,
  subtitle,
  action,
  ...props
}: CardProps) {
  const variants = {
    default: 'bg-surface border border-border rounded-xl shadow-xs',
    outline: 'bg-surface border border-border rounded-xl',
    subtle: 'bg-background border border-border/60 rounded-xl',
    ghost: 'bg-surface rounded-xl',
    interactive:
      'bg-surface border border-border rounded-xl shadow-xs transition-all duration-150 hover:border-gray-400 hover:bg-gray-50/50 hover:shadow-sm cursor-pointer',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const hasHeader = title != null || subtitle != null || action != null;

  return (
    <div
      className={cn(
        variants[variant],
        hoverable && 'transition-shadow duration-200 hover:shadow-cardHover',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/60 mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-textPrimary tracking-tight">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-sm text-textSecondary">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={paddings[padding]}>{children}</div>
    </div>
  );
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={cn('flex items-center justify-between pb-3 border-b border-border/60 mb-4', className)} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => {
  return (
    <h3 className={cn('text-base font-semibold text-textPrimary tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <p className={cn('text-sm text-textSecondary', className)} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
  return (
    <div className={cn('flex items-center justify-end gap-3 pt-4 border-t border-border/60 mt-4', className)} {...props}>
      {children}
    </div>
  );
};