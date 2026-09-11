import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
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
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-[#222222]/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => closeOnOverlayClick && onClose()}
      />

      <div 
        className={cn(
          "relative z-10 w-full max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-2xl transition-all animate-in zoom-in-95 duration-200 border border-[#E5E5E5]",
          sizes[size]
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-3 sm:pb-4 border-b border-[#E5E5E5]">
          <div>
            {title && <h3 className="text-base sm:text-lg font-bold text-[#222222]">{title}</h3>}
            {description && <p className="mt-1 text-xs sm:text-sm text-[#666666]">{description}</p>}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#666666] hover:text-[#222222] hover:bg-[#F5F5F5]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="py-4 text-sm text-[#222222]">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-[#E5E5E5]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
