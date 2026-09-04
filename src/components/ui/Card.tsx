import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'standard' | 'flat' | 'bordered' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className,
  variant = 'standard',
  padding = 'md',
  ...props
}: CardProps) {
  const baseStyles = "bg-white rounded-xl transition-all duration-200";

  const variants = {
    standard: "border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(15,76,129,0.05)]",
    flat: "bg-[#F8FAFC]",
    bordered: "border-2 border-[#E2E8F0]",
    interactive: "border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(15,76,129,0.05)] hover:shadow-[0_4px_12px_0_rgba(15,76,129,0.08)] hover:border-[#CBD5E1] cursor-pointer",
  };

  const paddings = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 pb-4 border-b border-[#E2E8F0] mb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-[#172033] tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-[#64748B]", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props}>{children}</div>;
}

export function CardFooter({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center pt-4 border-t border-[#E2E8F0] mt-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}
