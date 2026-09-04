import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole } from '@/types/auth';
import { Skeleton } from '@/components/ui/Skeleton';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      } else if (allowedRoles && user && !allowedRoles.includes(user.role) && user.role !== 'admin') {
        navigate('/admin/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F8FB] p-6">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0F4C81] mx-auto animate-pulse" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <Skeleton className="h-4 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
