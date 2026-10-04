import React from 'react';
import { cn } from '@/lib/utils';
import {
  FileText,
  DollarSign,
  Truck,
  PackageCheck,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  AlertCircle,
  Building,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { P2PStepMilestone } from '@/types/p2p';

interface P2PStepperProps {
  steps?: P2PStepMilestone[];
  currentOverallStatus?: string;
  className?: string;
  onStepAction?: (stepIndex: number, actionType: string) => void;
  activeRole?: string;
}

const STEP_ICONS = [
  FileText,     // 1. PR
  DollarSign,   // 2. Rate Finalisation
  Truck,        // 3. Challan & Dispatch
  PackageCheck, // 4. Goods Received
  CreditCard,   // 5. Payment
];

const STEP_ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  store_manager: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  manager:       { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  supplier:      { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  accountant:    { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  admin:         { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
};

export function P2PStepper({
  steps,
  currentOverallStatus,
  className,
  onStepAction,
  activeRole,
}: P2PStepperProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn('bg-white border border-gray-200 rounded-2xl p-5 shadow-xs', className)}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-5 border-b border-gray-100 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Procurement-to-Pay (P2P) Full Lifecycle
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Connected multi-role workflow: Store Manager → Operational Manager → Vendor → Store Manager → Accountant
          </p>
        </div>

        {currentOverallStatus && (
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-500 font-medium">Cycle Status:</span>
            <span className="font-bold text-gray-900 uppercase tracking-wide">
              {currentOverallStatus.replace(/_/g, ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {steps.map((step, idx) => {
          const StepIcon = STEP_ICONS[idx] || FileText;
          const isCompleted = step.status === 'COMPLETED';
          const isRejected = step.status === 'REJECTED';
          const isInProgress = step.status === 'IN_PROGRESS';
          const isPending = step.status === 'PENDING';
          const isWaiting = step.status === 'WAITING';

          const roleStyle = STEP_ROLE_COLORS[step.roleKey] || {
            bg: 'bg-gray-50',
            text: 'text-gray-700',
            border: 'border-gray-200',
          };

          return (
            <div
              key={step.stepIndex}
              className={cn(
                'relative flex flex-col justify-between p-4 rounded-xl border transition-all duration-200',
                isCompleted && 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-400/20',
                isRejected && 'bg-rose-50/40 border-rose-300 ring-1 ring-rose-400/20',
                isInProgress && 'bg-orange-50/50 border-orange-300 ring-2 ring-orange-400/30 shadow-xs',
                isPending && 'bg-amber-50/40 border-amber-300',
                isWaiting && 'bg-gray-50/60 border-gray-200 opacity-70'
              )}
            >
              {/* Header: Step Number, Role & Status Icon */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black bg-white shadow-2xs border border-gray-200 text-gray-800">
                    {step.stepIndex}
                  </span>

                  <span
                    className={cn(
                      'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border',
                      roleStyle.bg,
                      roleStyle.text,
                      roleStyle.border
                    )}
                  >
                    {step.roleName}
                  </span>

                  <div>
                    {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isRejected && <XCircle className="w-4 h-4 text-rose-600" />}
                    {isInProgress && <Clock className="w-4 h-4 text-orange-600 animate-spin" />}
                    {isPending && <Clock className="w-4 h-4 text-amber-500" />}
                    {isWaiting && <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />}
                  </div>
                </div>

                {/* Step Title & Icon */}
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      'p-1.5 rounded-lg border',
                      isCompleted && 'bg-emerald-100 text-emerald-800 border-emerald-200',
                      isRejected && 'bg-rose-100 text-rose-800 border-rose-200',
                      isInProgress && 'bg-orange-100 text-orange-800 border-orange-200',
                      isPending && 'bg-amber-100 text-amber-800 border-amber-200',
                      isWaiting && 'bg-gray-100 text-gray-500 border-gray-200'
                    )}
                  >
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    {step.stepName}
                  </h4>
                </div>

                {/* Status Badge */}
                <div className="mb-2">
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      Accepted / Done
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-100/60 px-2 py-0.5 rounded">
                      Rejected
                    </span>
                  )}
                  {isInProgress && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-100/60 px-2 py-0.5 rounded">
                      In Progress
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                      Pending Action
                    </span>
                  )}
                  {isWaiting && (
                    <span className="text-[11px] font-medium text-gray-400">
                      Awaiting prior step
                    </span>
                  )}
                </div>

                {/* Contextual Details */}
                <div className="space-y-1 text-[11px] text-gray-600 bg-white/80 p-2 rounded-lg border border-gray-100 mb-2">
                  {step.code && step.code !== 'N/A' && (
                    <div className="font-mono font-semibold text-gray-800 flex items-center justify-between">
                      <span>Doc:</span>
                      <span className="text-orange-600">{step.code}</span>
                    </div>
                  )}

                  {step.challanNumber && (
                    <div className="flex items-center justify-between">
                      <span>Challan:</span>
                      <span className="font-semibold text-purple-700">{step.challanNumber}</span>
                    </div>
                  )}

                  {step.vehicleNumber && (
                    <div className="flex items-center justify-between">
                      <span>Vehicle:</span>
                      <span className="font-semibold text-gray-800">{step.vehicleNumber}</span>
                    </div>
                  )}

                  {step.invoiceNumber && step.invoiceNumber !== 'N/A' && (
                    <div className="flex items-center justify-between">
                      <span>Invoice:</span>
                      <span className="font-semibold text-blue-700">{step.invoiceNumber}</span>
                    </div>
                  )}

                  {step.paymentNumber && (
                    <div className="flex items-center justify-between">
                      <span>Payment Ref:</span>
                      <span className="font-semibold text-emerald-700">{step.paymentNumber}</span>
                    </div>
                  )}

                  {step.details?.finalizedTotal && (
                    <div className="flex items-center justify-between font-semibold text-gray-900">
                      <span>Amount:</span>
                      <span>₹{Number(step.details.finalizedTotal).toLocaleString()}</span>
                    </div>
                  )}

                  {step.details?.totalAmount && (
                    <div className="flex items-center justify-between font-semibold text-gray-900">
                      <span>Amount:</span>
                      <span>₹{Number(step.details.totalAmount).toLocaleString()}</span>
                    </div>
                  )}

                  {step.remarks && (
                    <p className={cn('text-[10px] mt-1 p-1 rounded italic leading-tight', isRejected ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-50 text-gray-700')}>
                      "{step.remarks}"
                    </p>
                  )}
                </div>
              </div>

              {/* Timestamp & Actor */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
                <span className="truncate max-w-[90px]" title={step.actor || ''}>
                  {step.actor || 'Pending'}
                </span>
                <span>
                  {step.timestamp
                    ? new Date(step.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
