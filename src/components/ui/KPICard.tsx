import React from 'react';
import { Card } from './Card';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface KPICardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
  statusBadge?: React.ReactNode;
  subtitle?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  statusBadge,
  subtitle,
}) => {
  return (
    <Card hoverable className="relative overflow-hidden p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider truncate">{label}</p>
          <h4 className="text-xl sm:text-2xl font-bold text-black mt-1 tracking-tight truncate">{value}</h4>
        </div>
        {Icon && (
          <div className="p-2 sm:p-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg flex items-center justify-center shrink-0">
            <Icon size={20} className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        {change && (
          <div className="flex items-center gap-1">
            {changeType === 'positive' && <TrendingUp size={14} className="text-success" />}
            {changeType === 'negative' && <TrendingDown size={14} className="text-danger" />}
            <span
              className={cn(
                'font-medium',
                changeType === 'positive' && 'text-success',
                changeType === 'negative' && 'text-danger',
                changeType === 'neutral' && 'text-textSecondary'
              )}
            >
              {change}
            </span>
          </div>
        )}
        {subtitle && <span className="text-textMuted">{subtitle}</span>}
        {statusBadge && <div>{statusBadge}</div>}
      </div>
    </Card>
  );
};