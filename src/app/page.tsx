'use client';

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/Skeleton';
import { getDashboardRoute } from '@/lib/navigation';

export default function HomePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }
    navigate(getDashboardRoute(user.role), { replace: true });
  }, [isAuthenticated, isLoading, navigate, user]);

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