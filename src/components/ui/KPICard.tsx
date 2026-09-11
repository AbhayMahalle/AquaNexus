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
    <Card hoverable className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-textSecondary uppercase tracking-wider">{label}</p>
          <h4 className="text-2xl font-bold text-textPrimary mt-1.5">{value}</h4>
        </div>
        {Icon && (
          <div className="p-2.5 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center">
            <Icon size={22} />
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
