import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Droplets,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Boxes,
  TrendingUp,
  RotateCcw,
  FileText,
  CreditCard,
  AlertCircle,
  Users,
  DollarSign,
  PieChart,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const isDistributor = pathname.startsWith('/distributor');
  const isAccountant = pathname.startsWith('/accountant');

  const distributorItems: NavItem[] = [
    { label: 'Dashboard', href: '/distributor/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Products', href: '/distributor/products', icon: <Package className="w-4 h-4" /> },
    { label: 'Orders', href: '/distributor/orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { label: 'Distributor Stock', href: '/distributor/stock', icon: <Boxes className="w-4 h-4" /> },
    { label: 'Sales', href: '/distributor/sales', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Returns', href: '/distributor/returns', icon: <RotateCcw className="w-4 h-4" /> },
    { label: 'Invoices', href: '/distributor/invoices', icon: <FileText className="w-4 h-4" /> },
    { label: 'Payments', href: '/distributor/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Outstanding', href: '/distributor/outstanding', icon: <AlertCircle className="w-4 h-4" /> },
  ];

  const accountantItems: NavItem[] = [
    { label: 'Dashboard', href: '/accountant/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Payroll', href: '/accountant/payroll', icon: <Users className="w-4 h-4" /> },
    { label: 'Payments', href: '/accountant/payments', icon: <CreditCard className="w-4 h-4" /> },
    { label: 'Expenses', href: '/accountant/expenses', icon: <DollarSign className="w-4 h-4" /> },
    { label: 'Outstanding', href: '/accountant/outstanding', icon: <AlertCircle className="w-4 h-4" /> },
    { label: 'Financial Reports', href: '/accountant/reports', icon: <PieChart className="w-4 h-4" /> },
  ];

  const currentItems = isDistributor
    ? distributorItems
    : isAccountant
    ? accountantItems
    : distributorItems;

  return (
    <aside className="w-64 bg-white border-r border-[#E2E8F0] flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-[#E2E8F0] gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#0F4C81] flex items-center justify-center text-white shadow-sm">
          <Droplets className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base text-[#172033] leading-tight">Aqua Nexus</h1>
          <p className="text-[11px] text-[#64748B] font-medium">Water Plant ERP</p>
        </div>
      </div>

      {/* Role Selector Tabs / Indicator */}
      <div className="p-4 border-b border-[#E2E8F0]/60 bg-[#F5F8FB]/50">
        <div className="flex bg-[#E2E8F0]/60 p-1 rounded-[8px] text-xs font-semibold">
          <Link
            to="/distributor/dashboard"
            className={cn(
              'flex-1 text-center py-1.5 rounded-[6px] transition-colors',
              isDistributor
                ? 'bg-white text-[#0F4C81] shadow-subtle'
                : 'text-[#64748B] hover:text-[#172033]'
            )}
          >
            Distributor
          </Link>
          <Link
            to="/accountant/dashboard"
            className={cn(
              'flex-1 text-center py-1.5 rounded-[6px] transition-colors',
              isAccountant
                ? 'bg-white text-[#0F4C81] shadow-subtle'
                : 'text-[#64748B] hover:text-[#172033]'
            )}
          >
            Accountant
          </Link>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
          {isDistributor ? 'Distributor Operations' : 'Finance & Accounting'}
        </div>
        {currentItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/distributor/dashboard' &&
              item.href !== '/accountant/dashboard' &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'bg-[#0F4C81] text-white font-semibold shadow-subtle'
                  : 'text-[#64748B] hover:bg-[#F5F8FB] hover:text-[#172033]'
              )}
            >
              <span className={cn('shrink-0', isActive ? 'text-white' : 'text-[#64748B]')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-[#E2E8F0] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#1597D4]/15 border border-[#1597D4]/30 flex items-center justify-center font-bold text-xs text-[#0F4C81]">
          Y
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#172033] truncate">Yash (Developer)</p>
          <p className="text-[11px] text-[#64748B] truncate">
            {isDistributor ? 'Distributor Role' : 'Accountant Role'}
          </p>
        </div>
        <Settings className="w-4 h-4 text-[#94A3B8] hover:text-[#172033] cursor-pointer" />
      </div>
    </aside>
  );
};
