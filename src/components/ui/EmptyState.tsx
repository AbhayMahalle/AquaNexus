import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
    icon?: React.ReactNode;
  };
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F0F7FF] text-[#0F4C81] mb-4 shadow-sm border border-[#E0F0FE]">
        {icon || <Inbox className="h-8 w-8 text-[#0F4C81]" />}
      </div>
      <h3 className="text-base font-semibold text-[#172033] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#64748B] max-w-sm mb-5 leading-relaxed">{description}</p>
      )}
      {action && (
        <Button 
          variant="primary" 
          size="sm" 
          onClick={action.onClick}
          leftIcon={action.icon}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
