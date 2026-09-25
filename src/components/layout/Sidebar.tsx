import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getDashboardRoute, getNavigationForUser } from '@/lib/navigation';
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
  PackagePlus,
  PackageMinus,
  PackageCheck,
  Truck,
  Receipt,
  BarChart3,
  ShoppingCart,
  TrendingUp,
  RotateCcw,
  FileText,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  Bell,
  Wallet,
  MinusCircle,
  X,
  ChevronRight,
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
  PackagePlus: <PackagePlus className="w-5 h-5" />,
  PackageMinus: <PackageMinus className="w-5 h-5" />,
  PackageCheck: <PackageCheck className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Receipt: <Receipt className="w-5 h-5" />,
  BarChart3: <BarChart3 className="w-5 h-5" />,
  ShoppingCart: <ShoppingCart className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  RotateCcw: <RotateCcw className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  CreditCard: <CreditCard className="w-5 h-5" />,
  AlertCircle: <AlertCircle className="w-5 h-5" />,
  AlertTriangle: <AlertTriangle className="w-5 h-5" />,
  Bell: <Bell className="w-5 h-5" />,
  Wallet: <Wallet className="w-5 h-5" />,
  MinusCircle: <MinusCircle className="w-5 h-5" />,
};

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  theme?: 'default' | 'sample';
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const navSections = getNavigationForUser(user);

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col w-64 border-r transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto bg-white text-black border-gray-200 shadow-none',
          mobileOpen ? 'translate-x-0 shadow-erp-modal' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b bg-white border-gray-200">
          <Link href={user ? getDashboardRoute(user.role) : '/'} className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg group-hover:scale-105 transition-transform bg-orange-50 text-orange-600 border border-orange-200">
              <Droplets className="w-4 h-4 fill-orange-200 text-orange-600" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block leading-tight text-black">
                Aqua<span className="text-orange-600 font-extrabold">Nexus</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-semibold block text-gray-500">
                Water Plant ERP
              </span>
            </div>
          </Link>

          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="lg:hidden p-1.5 rounded-lg transition-colors text-gray-600 hover:text-black hover:bg-gray-100"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-0.5">
              {section.sectionTitle && (
                <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider py-1 text-gray-500">
                  {section.sectionTitle}
                </h4>
              )}
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin/dashboard' &&
                    item.href !== '/admin/store-manager-oversight/dashboard' &&
                    item.href !== '/manager/dashboard' &&
                    item.href !== '/store/dashboard' &&
                    item.href !== '/distributor/dashboard' &&
                    item.href !== '/accountant/dashboard' &&
                    pathname.startsWith(item.href));
                const icon = ICON_MAP[item.iconName] || <ChevronRight className="w-4 h-4" />;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 group border',
                      isActive
                        ? 'bg-gray-100 text-black font-bold border-l-[3px] border-l-orange-500 border-t-transparent border-r-transparent border-b-transparent shadow-xs'
                        : 'text-black border-transparent hover:bg-gray-100 hover:text-black'
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          'transition-colors',
                          isActive ? 'text-orange-600' : 'text-gray-600 group-hover:text-black'
                        )}
                      >
                        {icon}
                      </span>
                      <span>{item.title}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-[10px] font-bold rounded-md',
                          isActive
                            ? 'bg-orange-500 text-black font-bold'
                            : 'bg-gray-100 text-black'
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        <div className="p-3 border-t text-center bg-white border-gray-200">
          <p className="text-[10px] font-medium text-gray-500">
            AquaNexus Enterprise ERP
          </p>
        </div>
      </aside>
    </>
  );
}