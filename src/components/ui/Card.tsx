import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  icon,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'bg-surface border border-border rounded-xl shadow-erp p-5 transition-shadow duration-200 hover:shadow-erp-hover',
          className
        )
      )}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
          <div className="flex items-start gap-2.5">
            {icon && <div className="mt-0.5 text-primary shrink-0">{icon}</div>}
            <div>
              {title && <h3 className="text-sm font-bold text-text-primary">{title}</h3>}
              {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
