import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { Skeleton } from '@/components/ui/Skeleton';
import { getDashboardRoute } from '@/lib/navigation';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(`/login?redirect=${pathname}`, { replace: true });
      } else if (user) {
        if (user.role === 'super_admin') {
          // SuperAdmin is strictly isolated to platform governance and cannot view tenant ERP
          const isAllowedSuperAdminRoute =
            pathname.startsWith('/super-admin') || pathname.startsWith('/superadmin') || pathname === '/profile';
          if (!isAllowedSuperAdminRoute) {
            navigate('/super-admin/dashboard', { replace: true });
          }
        } else if (pathname.startsWith('/super-admin') || pathname.startsWith('/superadmin')) {
          // Tenant users cannot access superadmin platform governance
          navigate(getDashboardRoute(user.role), { replace: true });
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
          navigate(getDashboardRoute(user.role), { replace: true });
        }
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, navigate, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-primary mx-auto animate-pulse" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  if (user.role === 'super_admin') {
    const isAllowedSuperAdminRoute =
      pathname.startsWith('/super-admin') || pathname.startsWith('/superadmin') || pathname === '/profile';
    if (!isAllowedSuperAdminRoute) {
      return null;
    }
    return <>{children}</>;
  }

  if (pathname.startsWith('/super-admin') || pathname.startsWith('/superadmin')) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}