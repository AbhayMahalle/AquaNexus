import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition-shadow duration-200',
        hoverEffect && 'hover:shadow-[0_4px_12px_rgba(15,23,42,0.08)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
