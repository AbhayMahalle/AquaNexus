import React from 'react';
import { Search, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const Topbar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const getBreadcrumb = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return 'Dashboard';
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).replace('-', ' ')).join(' / ');
  };

  return (
    <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-8 sticky top-0 z-30 shadow-subtle">
      {/* Context / Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-[#94A3B8]">Aqua Nexus</span>
        <span className="text-xs text-[#CBD5E1]">/</span>
        <span className="text-xs font-semibold text-[#172033]">{getBreadcrumb()}</span>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64 hidden sm:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search orders, invoices..."
            className="w-full bg-[#F5F8FB] border border-[#E2E8F0] rounded-[8px] pl-9 pr-3 py-1.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#1597D4]"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#F5F8FB] transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#16A34A]" />
        </button>

        {/* Role Badge */}
        <div className="px-3 py-1 bg-[#0F4C81]/10 text-[#0F4C81] border border-[#0F4C81]/20 rounded-full text-xs font-semibold tracking-wide">
          {pathname.startsWith('/accountant') ? 'ACCOUNTANT ROLE' : 'DISTRIBUTOR ROLE'}
        </div>
      </div>
    </header>
  );
};
