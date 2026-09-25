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

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-xs border border-primary/20">
        <span className="inline-flex w-8 h-8 items-center justify-center">{icon || <Inbox className="h-8 w-8 text-primary" />}</span>
      </div>
      <h3 className="text-base font-semibold text-textPrimary mb-1">{title}</h3>
      {description && <p className="text-sm text-textSecondary max-w-sm mb-5 leading-relaxed">{description}</p>}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick} leftIcon={action.icon}>
          {action.label}
        </Button>
      )}
    </div>
  );
}