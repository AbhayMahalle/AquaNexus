import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { getNavigationForUser } from '@/lib/navigation';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { 
  Droplets, 
  LayoutDashboard, 
  Activity, 
  Layers, 
  Users, 
  ShieldCheck, 
  Lock, 
  CalendarCheck, 
  Factory, 
  Package, 
  Truck, 
  Receipt, 
  BarChart3, 
  X,
  ChevronRight
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-5 h-5" />,
  Activity: <Activity className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
  Users: <Users className="w-5 h-5" />,
  ShieldCheck: <ShieldCheck className="w-5 h-5" />,
  Lock: <Lock className="w-5 h-5" />,
  CalendarCheck: <CalendarCheck className="w-5 h-5" />,
  Factory: <Factory className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Receipt: <Receipt className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const pathname = location.pathname;
  const { user } = useAuth();
  const navSections = getNavigationForUser(user);

  const roleBadges: Record<string, { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger' | 'neutral' }> = {
    admin: { label: 'Admin', variant: 'primary' },
    manager: { label: 'Manager', variant: 'secondary' },
    store_manager: { label: 'Store Mgr', variant: 'success' },
    accountant: { label: 'Accountant', variant: 'info' },
    distributor: { label: 'Distributor', variant: 'warning' },
  };

  const defaultBadge: { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger' | 'neutral' } = { label: user?.role || 'Guest', variant: 'primary' };
  const currentRoleBadge = user?.role && roleBadges[user.role] ? roleBadges[user.role] : defaultBadge;

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#172033]/50 backdrop-blur-xs lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-[#0F4C81] text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto border-r border-[#0C3C68]",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#1597D4]/20 bg-[#0C3C68]/40">
          <Link to="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1597D4] to-[#22B8CF] text-white shadow-md group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                Aqua<span className="text-[#22B8CF]">Nexus</span>
              </span>
              <span className="text-[10px] text-[#22B8CF] uppercase tracking-widest font-semibold block">
                Water Plant ERP
              </span>
            </div>
          </Link>

          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {user && (
          <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#1597D4] text-white font-bold text-xs shrink-0">
                {user.avatar || user.name.charAt(0)}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[11px] text-white/60 truncate">{user.roleTitle}</p>
              </div>
            </div>
            <Badge variant={currentRoleBadge.variant} size="sm">
              {currentRoleBadge.label}
            </Badge>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.sectionTitle && (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#22B8CF]/80 py-1">
                  {section.sectionTitle}
                </h4>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                const icon = ICON_MAP[item.iconName] || <ChevronRight className="w-4 h-4" />;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 group",
                      isActive
                        ? "bg-[#1597D4] text-white shadow-md font-semibold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "transition-colors",
                        isActive ? "text-white" : "text-white/60 group-hover:text-white"
                      )}>
                        {icon}
                      </span>
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span className={cn(
                        "px-1.5 py-0.5 text-[10px] font-bold rounded-md",
                        isActive ? "bg-white text-[#0F4C81]" : "bg-[#22B8CF]/20 text-[#22B8CF]"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-3.5 border-t border-[#1597D4]/20 bg-[#0C3C68]/40 text-center">
          <p className="text-[11px] text-white/50">Water Plant ERP • Phase 1 (React.js)</p>
        </div>
      </aside>
    </>
  );
}
