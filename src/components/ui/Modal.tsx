import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: string;
  closeOnOverlayClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  subtitle,
  children,
  footer,
  size = 'md',
  maxWidth,
  closeOnOverlayClick = true,
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const effectiveMaxWidth = maxWidth ?? sizes[size];

  const subText = description ?? subtitle;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-textPrimary/50 backdrop-blur-sm transition-opacity"
        onClick={() => closeOnOverlayClick && onClose()}
      />

      <div
        className={cn(
          'relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-surface p-5 sm:p-6 shadow-erp-modal transition-all border border-border',
          effectiveMaxWidth
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-border">
          <div>
            {title && <h3 className="text-base sm:text-lg font-bold text-textPrimary">{title}</h3>}
            {subText && <p className="mt-1 text-xs sm:text-sm text-textSecondary">{subText}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-background"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="py-4 text-sm text-textPrimary">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}