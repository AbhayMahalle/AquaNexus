import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

import { cn } from '@/lib/utils';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  theme?: 'default' | 'sample';
}

export function DashboardLayout({ children, theme }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden overscroll-none bg-white text-black">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} theme={theme} />
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        <Topbar onMobileToggle={() => setMobileOpen(!mobileOpen)} theme={theme} />
        <main className="flex-1 overflow-y-auto overscroll-y-contain p-3.5 sm:p-5 lg:p-6 bg-white text-black">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}