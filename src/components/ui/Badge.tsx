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
    primary: "bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/20",
    secondary: "bg-[#1597D4]/10 text-[#1597D4] border border-[#1597D4]/20",
    success: "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20",
    warning: "bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/20",
    danger: "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20",
    info: "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20",
    neutral: "bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]",
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
