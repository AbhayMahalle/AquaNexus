import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ChevronRight, Home } from 'lucide-react';
import { BreadcrumbItem } from '@/types/navigation';

export interface ActionConfig {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'accent';
  loading?: boolean;
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: ActionConfig;
  secondaryActions?: ActionConfig[];
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  breadcrumbs = [],
  primaryAction,
  secondaryActions = [],
  children,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 space-y-3 pb-4 border-b border-[#E2E8F0]", className)}>
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Link to="/store/dashboard" className="hover:text-[#0F4C81] transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8]" />
              {b.href ? (
                <Link to={b.href} className="hover:text-[#0F4C81] transition-colors">
                  {b.label}
                </Link>
              ) : (
                <span className="font-semibold text-[#172033]">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] leading-snug">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-[#64748B] leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {(primaryAction || secondaryActions.length > 0) && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            {secondaryActions.map((sec, idx) => {
              if (sec.href) {
                return (
                  <Link key={idx} to={sec.href}>
                    <Button
                      variant={sec.variant || 'outline'}
                      size="sm"
                      leftIcon={sec.icon}
                      loading={sec.loading}
                    >
                      {sec.label}
                    </Button>
                  </Link>
                );
              }
              return (
                <Button
                  key={idx}
                  variant={sec.variant || 'outline'}
                  size="sm"
                  onClick={sec.onClick}
                  leftIcon={sec.icon}
                  loading={sec.loading}
                >
                  {sec.label}
                </Button>
              );
            })}

            {primaryAction && (
              primaryAction.href ? (
                <Link to={primaryAction.href}>
                  <Button
                    variant={primaryAction.variant || 'primary'}
                    size="sm"
                    leftIcon={primaryAction.icon}
                    loading={primaryAction.loading}
                  >
                    {primaryAction.label}
                  </Button>
                </Link>
              ) : (
                <Button
                  variant={primaryAction.variant || 'primary'}
                  size="sm"
                  onClick={primaryAction.onClick}
                  leftIcon={primaryAction.icon}
                  loading={primaryAction.loading}
                >
                  {primaryAction.label}
                </Button>
              )
            )}
          </div>
        )}
      </div>

      {children && <div className="pt-2">{children}</div>}
    </div>
  );
}
