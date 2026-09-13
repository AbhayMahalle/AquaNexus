import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[#F8F8F8] overscroll-none">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        <Topbar onMobileToggle={() => setMobileOpen(!mobileOpen)} />

        <main className="flex-1 overflow-y-auto overscroll-y-contain p-3.5 sm:p-5 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
