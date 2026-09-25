import React from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'content'> {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, side = 'top', children, className, ...props }: TooltipProps) {
  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-flex cursor-pointer" {...props}>
      {children}
      <div
        className={cn(
          'pointer-events-none absolute z-50 hidden whitespace-nowrap rounded-md bg-textPrimary px-2 py-1 text-xs font-medium text-white shadow-dropdown group-hover:block',
          sideClasses[side],
          className
        )}
        role="tooltip"
      >
        {content}
      </div>
    </div>
  );
}