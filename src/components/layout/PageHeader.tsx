import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '@/types/navigation';
import { useAuth } from '@/context/AuthContext';
import { getDashboardRoute } from '@/lib/navigation';

export interface ActionConfig {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent' | 'orange';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  breadcrumb?: string[];
  action?: React.ReactNode;
  primaryAction?: ActionConfig;
  secondaryActions?: ActionConfig[];
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  breadcrumb,
  action,
  primaryAction,
  secondaryActions = [],
  children,
  className,
}: PageHeaderProps) {
  const { user } = useAuth();
  const homeRoute = user ? getDashboardRoute(user.role) : '/';
  const effectiveBreadcrumbs: BreadcrumbItem[] =
    breadcrumbs ?? (breadcrumb ? breadcrumb.map((b) => ({ label: b })) : []);

  return (
    <div className={cn('mb-4 sm:mb-6 space-y-2 pb-3.5 sm:pb-4 border-b border-border', className)}>
      {effectiveBreadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-textSecondary flex-wrap">
          <Link to={homeRoute} className="hover:text-primary transition-colors flex items-center gap-1 font-medium">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          {effectiveBreadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-textMuted" />
              {b.href ? (
                <Link to={b.href} className="hover:text-primary transition-colors">
                  {b.label}
                </Link>
              ) : (
                <span className="font-semibold text-textPrimary">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-textPrimary leading-snug">{title}</h1>
          {description && (
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-textSecondary leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {action && <div>{action}</div>}
          {secondaryActions.map((sec, idx) => {
            if (sec.href) {
              return (
                <Link key={idx} to={sec.href}>
                  <Button variant={sec.variant || 'outline'} size="sm" leftIcon={sec.icon} loading={sec.loading} className={sec.className}>
                    {sec.label}
                  </Button>
                </Link>
              );
            }
            return (
              <Button key={idx} variant={sec.variant || 'outline'} size="sm" onClick={sec.onClick} leftIcon={sec.icon} loading={sec.loading} disabled={sec.disabled} className={sec.className}>
                {sec.label}
              </Button>
            );
          })}
          {primaryAction &&
            (primaryAction.href ? (
              <Link to={primaryAction.href}>
                <Button variant={primaryAction.variant || 'primary'} size="sm" leftIcon={primaryAction.icon} loading={primaryAction.loading} disabled={primaryAction.disabled} className={primaryAction.className}>
                  {primaryAction.label}
                </Button>
              </Link>
            ) : (
              <Button variant={primaryAction.variant || 'primary'} size="sm" onClick={primaryAction.onClick} leftIcon={primaryAction.icon} loading={primaryAction.loading} disabled={primaryAction.disabled} className={primaryAction.className}>
                {primaryAction.label}
              </Button>
            ))}
        </div>
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}