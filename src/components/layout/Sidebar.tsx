import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  Receipt,
  PieChart,
  ChevronDown,
  LogOut,
  UserCheck
} from 'lucide-react';
import { UserRole } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

import { LucideIcon } from 'lucide-react';

interface NavGroup {
  title: string;
  items: {
    label: string;
    path: string;
    icon: LucideIcon;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRole, onRoleChange }) => {
  const navigate = useNavigate();

  // Navigation items per role
  const getNavGroups = (): NavGroup[] => {
    if (currentRole === 'distributor') {
      return [
        {
          title: 'MAIN',
          items: [
            { label: 'Dashboard', path: '/distributor/dashboard', icon: LayoutDashboard },
            { label: 'Products', path: '/distributor/products', icon: Package },
          ],
        },
        {
          title: 'SALES & ORDERS',
          items: [
            { label: 'Orders', path: '/distributor/orders', icon: ShoppingCart },
            { label: 'Distributor Stock', path: '/distributor/stock', icon: Boxes },
            { label: 'Sales History', path: '/distributor/sales', icon: TrendingUp },
            { label: 'Returns', path: '/distributor/returns', icon: RotateCcw },
          ],
        },
        {
          title: 'FINANCE & BILLING',
          items: [
            { label: 'Invoices', path: '/distributor/invoices', icon: FileText },
            { label: 'Payments', path: '/distributor/payments', icon: CreditCard },
            { label: 'Outstanding Dues', path: '/distributor/outstanding', icon: AlertCircle },
          ],
        },
      ];
    } else if (currentRole === 'accountant') {
      return [
        {
          title: 'MAIN',
          items: [
            { label: 'Dashboard', path: '/accountant/dashboard', icon: LayoutDashboard },
          ],
        },
        {
          title: 'FINANCIAL MANAGEMENT',
          items: [
            { label: 'Payroll', path: '/accountant/payroll', icon: Users },
            { label: 'Payments', path: '/accountant/payments', icon: DollarSign },
            { label: 'Expenses', path: '/accountant/expenses', icon: Receipt },
            { label: 'Outstanding Summary', path: '/accountant/outstanding', icon: AlertCircle },
            { label: 'Financial Reports', path: '/accountant/reports', icon: PieChart },
          ],
        },
      ];
    }
    // Fallback default
    return [];
  };

  const navGroups = getNavGroups();

  return (
    <aside className="w-64 bg-surface border-r border-border h-screen flex flex-col fixed left-0 top-0 z-30 select-none">
      {/* Brand Logo Header */}
      <div className="h-16 px-6 border-b border-border flex items-center gap-3">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white shadow-sm">
          <Droplets size={22} className="text-accent" />
        </div>
        <div>
          <h1 className="text-base font-extrabold text-primary tracking-tight leading-none">AquaNexus</h1>
          <span className="text-[10px] font-semibold text-textSecondary uppercase tracking-widest">Water Plant ERP</span>
        </div>
      </div>

      {/* Role Switcher Demo Control */}
      <div className="px-4 py-3 bg-bgMain border-b border-border">
        <div className="text-[11px] font-semibold text-textMuted uppercase tracking-wider mb-1 flex items-center gap-1">
          <UserCheck size={12} /> Current Access Role
        </div>
        <div className="relative">
          <select
            value={currentRole}
            onChange={(e) => {
              const newRole = e.target.value as UserRole;
              onRoleChange(newRole);
              if (newRole === 'distributor') navigate('/distributor/dashboard');
              if (newRole === 'accountant') navigate('/accountant/dashboard');
            }}
            className="w-full text-xs font-semibold bg-surface border border-border rounded-md px-2.5 py-1.5 text-textPrimary focus:outline-none focus:ring-1 focus:ring-secondary appearance-none cursor-pointer"
          >
            <option value="distributor">Distributor View (Yash)</option>
            <option value="accountant">Accountant View (Yash)</option>
          </select>
          <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-textMuted pointer-events-none" />
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <div className="px-3 mb-2 text-[11px] font-bold text-textMuted uppercase tracking-wider">
              {group.title}
            </div>
            <div className="space-y-1">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'bg-primary text-white font-semibold shadow-xs'
                          : 'text-textSecondary hover:bg-bgMain hover:text-textPrimary'
                      )
                    }
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile Footer */}
      <div className="p-3 border-t border-border bg-bgMain/50">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary font-bold text-xs flex items-center justify-center">
              {currentRole === 'distributor' ? 'YS' : 'YA'}
            </div>
            <div>
              <p className="text-xs font-bold text-textPrimary">Yash (Developer)</p>
              <p className="text-[11px] text-textMuted capitalize">{currentRole.replace('_', ' ')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            title="Sign Out"
            className="p-1 text-textMuted hover:text-danger rounded-md hover:bg-surface transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};
