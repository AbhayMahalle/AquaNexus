import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load data from server. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-danger/5 border border-danger/20 rounded-xl my-4">
      <div className="p-3 bg-danger/10 text-danger rounded-full mb-3">
        <AlertTriangle size={24} />
      </div>
      <h4 className="text-sm font-semibold text-danger">{title}</h4>
      <p className="text-xs text-textSecondary max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
