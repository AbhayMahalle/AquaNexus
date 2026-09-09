import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
  breadcrumbs,
}) => {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-text-muted mb-1.5 font-medium">
          <a href="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <Home className="w-3 h-3" />
            <span>Home</span>
          </a>
          {breadcrumbs && breadcrumbs.length > 0 ? (
            breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-text-muted" />
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-primary transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-text-primary font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))
          ) : (
            <>
              <ChevronRight className="w-3 h-3 text-text-muted" />
              <span className="text-text-primary font-semibold">{title}</span>
            </>
          )}
        </nav>
        <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">{title}</h1>
        {description && <p className="text-xs text-text-secondary mt-1 max-w-3xl">{description}</p>}
      </div>

      {action && <div className="shrink-0 flex items-center gap-2 mt-1 md:mt-0">{action}</div>}
    </div>
  );
};
