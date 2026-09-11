import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to Load Data',
  message = 'Unable to reach backend server at http://localhost:5000/api. Ensure the backend service is running and CORS is configured.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 my-4 text-center border border-rose-200/80 rounded-xl bg-rose-50/50">
      <div className="w-12 h-12 mb-3 rounded-full bg-rose-100/70 border border-rose-200/50 flex items-center justify-center text-rose-500">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} icon={<RotateCw className="w-3.5 h-3.5" />}>
          Try Again
        </Button>
      )}
    </div>
  );
};
