import React from 'react';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  AlertTriangle,
  CreditCard,
  FileCheck,
  RotateCcw,
} from 'lucide-react';

interface P2PStatusBadgeProps {
  status: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function P2PStatusBadge({ status, className, size = 'sm' }: P2PStatusBadgeProps) {
  const norm = (status || '').toUpperCase().trim();

  let label = status;
  let bg = 'bg-gray-100 text-gray-700 border-gray-200';
  let icon: React.ReactNode = <Clock className="w-3 h-3" />;

  switch (norm) {
    // Stage 1 & 2: PR Statuses
    case 'DRAFT':
      label = 'Draft PR';
      bg = 'bg-gray-100 text-gray-700 border-gray-300';
      icon = <Clock className="w-3 h-3 text-gray-500" />;
      break;
    case 'PENDING_RATE_APPROVAL':
    case 'PENDING_APPROVAL':
      label = 'Rate Finalisation Pending';
      bg = 'bg-amber-50 text-amber-700 border-amber-200';
      icon = <Clock className="w-3 h-3 text-amber-600" />;
      break;
    case 'RATES_FINALIZED':
      label = 'Rates Approved';
      bg = 'bg-blue-50 text-blue-700 border-blue-200';
      icon = <CheckCircle2 className="w-3 h-3 text-blue-600" />;
      break;
    case 'REJECTED':
    case 'PR_REJECTED':
      label = 'PR Rejected';
      bg = 'bg-red-50 text-red-700 border-red-200';
      icon = <XCircle className="w-3 h-3 text-red-600" />;
      break;

    // Stage 3: PO & Challan Statuses
    case 'ISSUED':
    case 'PO_ISSUED':
      label = 'PO Issued';
      bg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      icon = <FileCheck className="w-3 h-3 text-indigo-600" />;
      break;
    case 'VENDOR_ACCEPTED':
      label = 'Vendor Accepted';
      bg = 'bg-cyan-50 text-cyan-700 border-cyan-200';
      icon = <CheckCircle2 className="w-3 h-3 text-cyan-600" />;
      break;
    case 'VENDOR_REJECTED':
      label = 'Vendor Rejected';
      bg = 'bg-red-50 text-red-700 border-red-200';
      icon = <XCircle className="w-3 h-3 text-red-600" />;
      break;
    case 'CHALLAN_CREATED':
      label = 'Challan Created';
      bg = 'bg-purple-50 text-purple-700 border-purple-200';
      icon = <Truck className="w-3 h-3 text-purple-600" />;
      break;
    case 'OUT_FOR_DELIVERY':
      label = 'Out for Delivery';
      bg = 'bg-orange-50 text-orange-700 border-orange-300 font-semibold animate-pulse';
      icon = <Truck className="w-3 h-3 text-orange-600" />;
      break;

    // Stage 4: Goods Received
    case 'GOODS_RECEIVED':
    case 'ACCEPTED':
      label = 'Goods Received & Inwarded';
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold';
      icon = <PackageCheck className="w-3 h-3 text-emerald-600" />;
      break;
    case 'GOODS_REJECTED':
      label = 'Goods Rejected at Dock';
      bg = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold';
      icon = <AlertTriangle className="w-3 h-3 text-rose-600" />;
      break;
    case 'PARTIALLY_ACCEPTED':
      label = 'Partially Received';
      bg = 'bg-yellow-50 text-yellow-800 border-yellow-300';
      icon = <AlertTriangle className="w-3 h-3 text-yellow-600" />;
      break;

    // Stage 5: Invoices & Payment
    case 'INVOICE_SUBMITTED':
    case 'SUBMITTED':
      label = 'Invoice Submitted';
      bg = 'bg-sky-50 text-sky-700 border-sky-200';
      icon = <Clock className="w-3 h-3 text-sky-600" />;
      break;
    case 'INVOICE_APPROVED':
    case 'APPROVED':
      label = 'Invoice Approved';
      bg = 'bg-teal-50 text-teal-700 border-teal-200';
      icon = <CheckCircle2 className="w-3 h-3 text-teal-600" />;
      break;
    case 'INVOICE_REJECTED':
      label = 'Invoice Rejected';
      bg = 'bg-red-50 text-red-700 border-red-200';
      icon = <XCircle className="w-3 h-3 text-red-600" />;
      break;
    case 'PAYMENT_PENDING':
      label = 'Payment Pending';
      bg = 'bg-amber-50 text-amber-800 border-amber-300 font-medium';
      icon = <CreditCard className="w-3 h-3 text-amber-600" />;
      break;
    case 'PARTIALLY_PAID':
      label = 'Partially Paid';
      bg = 'bg-violet-50 text-violet-700 border-violet-200';
      icon = <CreditCard className="w-3 h-3 text-violet-600" />;
      break;
    case 'PAID':
    case 'COMPLETED':
      label = 'Completed & Paid';
      bg = 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      break;
    case 'CANCELLED':
      label = 'Cancelled';
      bg = 'bg-gray-100 text-gray-500 border-gray-300 line-through';
      icon = <RotateCcw className="w-3 h-3 text-gray-400" />;
      break;
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border shadow-2xs transition-colors',
        sizeClasses,
        bg,
        className
      )}
    >
      {icon}
      <span>{label}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const norm = (priority || '').toUpperCase();
  const styles = {
    URGENT: 'bg-red-100 text-red-700 border-red-300 font-bold',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-300 font-semibold',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    LOW: 'bg-gray-100 text-gray-600 border-gray-200',
  }[norm] || 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-semibold border', styles)}>
      {priority || 'MEDIUM'}
    </span>
  );
}

export function ThreeWayMatchBadge({ status }: { status?: string | null }) {
  const norm = (status || '').toUpperCase();
  if (norm === 'MATCHED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        3-Way Match Verified
      </span>
    );
  }
  if (norm === 'OVERBILLED' || norm === 'DISCREPANCY') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
        <AlertTriangle className="w-3 h-3 text-red-600" />
        Discrepancy Detected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
      <Clock className="w-3 h-3 text-gray-400" />
      Match Pending
    </span>
  );
}
