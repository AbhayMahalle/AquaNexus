import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAID'
  | 'PARTIAL'
  | 'OVERDUE'
  | 'AVAILABLE'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED';

export interface BadgeProps {
  status: BadgeStatus | string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className }) => {
  const normalized = status.toUpperCase();

  const getStyles = () => {
    switch (normalized) {
      case 'DELIVERED':
      case 'PAID':
      case 'AVAILABLE':
      case 'APPROVED':
      case 'COMPLETED':
        return 'bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20';

      case 'CONFIRMED':
      case 'DISPATCHED':
      case 'PROCESSING':
      case 'PARTIAL':
        return 'bg-[#1597D4]/10 text-[#1597D4] border-[#1597D4]/20';

      case 'PENDING':
      case 'LOW_STOCK':
        return 'bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/20';

      case 'CANCELLED':
      case 'OVERDUE':
      case 'OUT_OF_STOCK':
      case 'REJECTED':
        return 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/20';

      default:
        return 'bg-[#64748B]/10 text-[#64748B] border-[#64748B]/20';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide uppercase',
        getStyles(),
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
};
