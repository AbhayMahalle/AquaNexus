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
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        navigate(getDashboardRoute(user.role), { replace: true });
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

  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}