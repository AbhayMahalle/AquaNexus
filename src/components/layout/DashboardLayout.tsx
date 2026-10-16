import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  theme?: 'default' | 'sample';
}

const SIDEBAR_COLLAPSED_KEY = 'aquanexus_sidebar_collapsed';

export function DashboardLayout({ children, theme }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === SIDEBAR_COLLAPSED_KEY && e.newValue !== null) {
        setCollapsed(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden overscroll-none bg-white text-black">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleSidebar}
        theme={theme}
      />
      <div className="flex flex-col flex-1 w-full min-w-0 overflow-hidden">
        <Topbar
          onMobileToggle={() => setMobileOpen(!mobileOpen)}
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          theme={theme}
        />
        <main className="flex-1 overflow-y-auto overscroll-y-contain p-3.5 sm:p-5 lg:p-6 bg-white text-black">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}