import React, { forwardRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';

export interface NextLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href?: string;
  to?: string;
  children?: React.ReactNode;
  replace?: boolean;
  scroll?: boolean;
  prefetch?: boolean;
  className?: string;
}

export const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(
  ({ href, to, children, ...props }, ref) => {
    const target = to || href || '#';
    return (
      <RouterLink ref={ref} to={target} {...props}>
        {children}
      </RouterLink>
    );
  }
);

Link.displayName = 'NextLinkShim';

export default Link;
