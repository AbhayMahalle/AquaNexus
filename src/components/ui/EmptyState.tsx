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
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF7ED] text-[#EA580C] mb-4 shadow-xs border border-[#FED7AA]/50">
        {icon || <Inbox className="h-8 w-8 text-[#EA580C]" />}
      </div>
      <h3 className="text-base font-semibold text-[#222222] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#666666] max-w-sm mb-5 leading-relaxed">{description}</p>
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
