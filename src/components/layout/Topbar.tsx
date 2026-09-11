import React from 'react';
import { Bell, Search, ShieldCheck } from 'lucide-react';
import { UserRole } from '@/lib/types';

export interface TopbarProps {
  currentRole: UserRole;
}

export const Topbar: React.FC<TopbarProps> = ({ currentRole }) => {
  return (
    <header className="h-16 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input Context */}
      <div className="relative w-72 hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-textMuted" size={16} />
        <input
          type="text"
          placeholder="Search orders, invoices, stock..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-bgMain border border-border rounded-lg text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-secondary/40 transition-colors"
        />
      </div>

      {/* Right User & Context Badges */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs font-semibold">
          <ShieldCheck size={14} />
          <span className="capitalize">{currentRole.replace('_', ' ')} Mode</span>
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-textSecondary hover:text-textPrimary hover:bg-bgMain rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        </button>

        {/* Plant Status Indicator */}
        <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border text-xs">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-semibold text-textPrimary">Plant Status: Operational</span>
        </div>
      </div>
    </header>
  );
};
