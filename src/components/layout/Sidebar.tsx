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

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#222222]/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-white text-[#222222] border-r border-[#E5E5E5] transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Branding Area */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-[#E5E5E5] bg-white">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FFF7ED] text-[#F97316] border border-[#FED7AA]/50 group-hover:scale-105 transition-transform">
              <Droplets className="w-4 h-4 fill-[#F97316]/20 text-[#F97316]" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-[#222222] block leading-tight">
                Aqua<span className="text-[#F97316]">Nexus</span>
              </span>
              <span className="text-[9px] text-[#999999] uppercase tracking-widest font-semibold block">
                Water Plant ERP
              </span>
            </div>
          </Link>

          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden text-[#666666] hover:text-[#222222] p-1.5 rounded-lg hover:bg-[#F5F5F5] transition-colors"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {section.sectionTitle && (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#999999] py-1">
                  {section.sectionTitle}
                </h4>
              )}
              {section.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/manager/dashboard' && pathname?.startsWith(item.href));
                const icon = ICON_MAP[item.iconName] || <ChevronRight className="w-4 h-4" />;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 group border",
                      isActive
                        ? "bg-[#F0F0F0] text-[#222222] font-semibold border-l-3 border-l-[#F97316] border-t-transparent border-r-transparent border-b-transparent shadow-xs"
                        : "text-[#666666] border-transparent hover:bg-[#F5F5F5] hover:text-[#222222]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "transition-colors",
                        isActive ? "text-[#F97316]" : "text-[#999999] group-hover:text-[#222222]"
                      )}>
                        {icon}
                      </span>
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span className={cn(
                        "px-1.5 py-0.5 text-[10px] font-bold rounded-md",
                        isActive ? "bg-[#F97316] text-white" : "bg-[#F5F5F5] text-[#666666]"
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

        {/* Footer info */}
        <div className="p-3 border-t border-[#E5E5E5] bg-[#FAFAFA] text-center">
          <p className="text-[10px] text-[#999999] font-medium">AquaNexus Enterprise ERP</p>
        </div>
      </aside>
    </>
  );
}
