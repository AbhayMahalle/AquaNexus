import React from 'react';
import { Bell, ChevronDown, Building2, Sparkles, UserCheck } from 'lucide-react';

export const Topbar: React.FC = () => {
  return (
    <header className="h-14 bg-surface border-b border-border px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left side: Plant Unit Context Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/80 border border-border rounded-md text-xs font-semibold text-text-primary">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span>AquaNexus Main Unit - Pune</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-3">
        {/* Foundation UI badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-cyan-50 border border-cyan-200 rounded-md text-[11px] font-semibold text-cyan-800">
          <Sparkles className="w-3 h-3 text-cyan-600" />
          <span>Foundation UI</span>
        </div>

        {/* Mode Selector Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-border rounded-md text-[11px] font-semibold text-text-primary cursor-pointer hover:bg-slate-200/60 transition-colors">
          <UserCheck className="w-3.5 h-3.5 text-secondary" />
          <span>Niranjan Mode (HR & Ops)</span>
          <ChevronDown className="w-3 h-3 text-text-muted" />
        </div>

        {/* Notification bell */}
        <button className="relative p-2 text-text-secondary hover:text-text-primary hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-danger rounded-full ring-2 ring-surface"></span>
        </button>

        <div className="h-4 w-px bg-border"></div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#0F4C81] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            N
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-text-primary leading-tight">Niranjan (HR Lead)</p>
            <p className="text-[10px] font-medium text-text-secondary">HR & Operations Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
};
