import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: string[];
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumb,
  action,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-textMuted mb-1 font-medium">
            {breadcrumb.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span>/</span>}
                <span className={idx === breadcrumb.length - 1 ? 'text-textSecondary font-semibold' : ''}>
                  {item}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="text-2xl font-bold text-textPrimary tracking-tight">{title}</h1>
        {description && <p className="text-xs text-textSecondary mt-0.5">{description}</p>}
      </div>

      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
};
