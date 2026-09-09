import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Droplet, 
  Users, 
  CalendarCheck, 
  CalendarOff, 
  Clock, 
  Factory, 
  LayoutDashboard,
  Layers,
  ChevronRight
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navSections = [
    {
      title: 'MAIN',
      items: [
        { label: 'Overview Dashboard', path: '/', icon: LayoutDashboard, badge: 'Main' },
      ],
    },
    {
      title: 'EMPLOYEE & HR MANAGEMENT',
      items: [
        { label: 'Employee Catalog', path: '/employees', icon: Users, badge: '5 Staff' },
        { label: 'Daily Attendance', path: '/attendance', icon: CalendarCheck },
        { label: 'Monthly Summary', path: '/attendance/monthly', icon: Layers },
        { label: 'Leave Requests', path: '/leave', icon: CalendarOff, badge: 'Pending' },
        { label: 'Overtime Logs', path: '/overtime', icon: Clock },
      ],
    },
    {
      title: 'PLANT OPERATIONS',
      items: [
        { label: 'Production Batches', path: '/production', icon: Factory, badge: 'Active' },
        { label: 'Production History', path: '/production/history', icon: Clock },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0B3B66] text-white flex flex-col h-screen sticky top-0 shrink-0 select-none z-30 shadow-md">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 bg-[#082E52]/60">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-[#1597D4] flex items-center justify-center text-white shadow-sm">
            <Droplet className="w-4 h-4 fill-current text-white" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight leading-none">AquaNexus</h1>
            <p className="text-[10px] font-semibold tracking-wider text-cyan-200/70 uppercase mt-0.5">WATER PLANT ERP</p>
          </div>
        </div>

        {/* User Role Pill */}
        <div className="flex items-center justify-between p-2 rounded-md bg-white/10 border border-white/10 text-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded-full bg-[#1597D4] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              N
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-white truncate text-[11px]">Niranjan (HR Lead)</p>
              <p className="text-[9px] text-cyan-200/70 truncate">HR & Ops Manager</p>
            </div>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-semibold border border-emerald-400/30">HR Mgr</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-cyan-200/60 uppercase">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-[#1597D4] text-white font-semibold shadow-sm'
                        : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <item.icon className="w-4 h-4 shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="text-[10px] bg-white/20 text-white font-medium px-1.5 py-0.5 rounded-full shrink-0">
                      {item.badge}
                    </span>
                  ) : (
                    <ChevronRight className="w-3 h-3 opacity-40 shrink-0" />
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Footer */}
      <div className="p-3 border-t border-white/10 bg-[#082E52]/40 text-center">
        <p className="text-[10px] text-white/50 font-medium">Water Plant ERP • Phase 1 (React.js)</p>
      </div>
    </aside>
  );
};
