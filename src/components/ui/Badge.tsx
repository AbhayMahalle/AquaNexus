import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Badge({
  children,
  className,
  variant = 'neutral',
  size = 'md',
  icon,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-1.5 font-medium rounded-full tracking-tight shrink-0";

  const variants = {
    primary: "bg-[#FFF7ED] text-[#EA580C] border border-[#FDBA74]/40",
    secondary: "bg-[#F5F5F5] text-[#666666] border border-[#E5E5E5]",
    success: "bg-[#F0FDF4] text-[#16A34A] border border-[#86EFAC]/40",
    warning: "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]/50",
    danger: "bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]/50",
    info: "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/50",
    neutral: "bg-[#F5F5F5] text-[#666666] border border-[#E5E5E5]",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-semibold",
  };

  return (
    <span
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
