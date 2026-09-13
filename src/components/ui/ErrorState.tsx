import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message = "An unexpected network error occurred. Please check your connection and try again.",
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-center bg-[#FEF2F2]/50 border border-[#DC2626]/20 rounded-xl", className)}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DC2626]/10 text-[#DC2626] mb-3">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-[#DC2626] mb-1">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
