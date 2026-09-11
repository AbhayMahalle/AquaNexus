import React from 'react';
import { PackageOpen, LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="p-3.5 bg-secondary/10 text-secondary rounded-full mb-3.5">
        <Icon size={28} />
      </div>
      <h4 className="text-base font-semibold text-textPrimary">{title}</h4>
      {description && <p className="text-xs text-textSecondary max-w-sm mt-1 mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
