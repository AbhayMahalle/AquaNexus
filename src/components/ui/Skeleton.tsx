import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circle' | 'rectangle' | 'card';
}

export function Skeleton({
  className,
  variant = 'rectangle',
  ...props
}: SkeletonProps) {
  const variants = {
    text: "h-4 w-full rounded",
    circle: "h-10 w-10 rounded-full shrink-0",
    rectangle: "h-12 w-full rounded-lg",
    card: "h-32 w-full rounded-xl border border-[#E2E8F0]",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-[#E2E8F0]/70",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
