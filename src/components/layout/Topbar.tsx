import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/types/auth';
import { 
  Menu, 
  User as UserIcon, 
  LogOut, 
  Building2, 
  Bell, 
  Shield, 
  CheckCircle2, 
  Layers,
  ChevronDown 
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopbarProps {
  onMobileToggle?: () => void;
}

export function Topbar({ onMobileToggle }: TopbarProps) {
  const { user, logout, switchRole } = useAuth();

  const roleLabels: Record<UserRole, string> = {
    admin: 'Admin Mode',
    manager: 'Manager Mode',
    store_manager: 'Store Mgr Mode (Ram)',
    accountant: 'Accountant Mode (Yash)',
    distributor: 'Distributor Mode (Niranjan)',
    operator: 'Operator Mode',
  };

  const handleRoleChange = (role: UserRole) => {
    switchRole(role);
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-[#E2E8F0] shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-lg text-[#64748B] hover:bg-[#F5F8FB] hover:text-[#172033] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F8FB] border border-[#E2E8F0]">
          <Building2 className="w-4 h-4 text-[#0F4C81]" />
          <span className="text-xs font-semibold text-[#172033]">
            {user?.plantName || 'AquaNexus Unit #1'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link to="/foundation-test">
          <Button variant="outline" size="sm" leftIcon={<Layers className="w-4 h-4 text-[#1597D4]" />}>
            <span className="hidden md:inline">Foundation</span> UI
          </Button>
        </Link>

        <Dropdown
          trigger={
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0F4C81]/10 text-[#0F4C81] hover:bg-[#0F4C81]/20 transition-colors text-xs font-bold border border-[#0F4C81]/20">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{user?.role ? roleLabels[user.role] : 'Switch Role'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          }
          items={[
            {
              label: 'Switch Active Role:',
              disabled: true,
            },
            {
              label: '👑 Admin (Mrudula Lead)',
              icon: user?.role === 'admin' ? <CheckCircle2 className="text-[#16A34A]" /> : undefined,
              onClick: () => handleRoleChange('admin'),
            },
            {
              label: '👔 Operations Manager',
              icon: user?.role === 'manager' ? <CheckCircle2 className="text-[#16A34A]" /> : undefined,
              onClick: () => handleRoleChange('manager'),
            },
            {
              label: '📦 Store Manager (Ram)',
              icon: user?.role === 'store_manager' ? <CheckCircle2 className="text-[#16A34A]" /> : undefined,
              onClick: () => handleRoleChange('store_manager'),
            },
            {
              label: '💼 Accountant (Yash)',
              icon: user?.role === 'accountant' ? <CheckCircle2 className="text-[#16A34A]" /> : undefined,
              onClick: () => handleRoleChange('accountant'),
            },
            {
              label: '🚚 Distributor (Niranjan)',
              icon: user?.role === 'distributor' ? <CheckCircle2 className="text-[#16A34A]" /> : undefined,
              onClick: () => handleRoleChange('distributor'),
            },
          ]}
        />

        <button 
          className="relative p-2 rounded-lg text-[#64748B] hover:bg-[#F5F8FB] hover:text-[#172033] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#DC2626]" />
        </button>

        <div className="h-6 w-px bg-[#E2E8F0] mx-1" />

        <Dropdown
          trigger={
            <div className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-[#F5F8FB] transition-colors">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0F4C81] text-white font-bold text-xs shadow-xs">
                {user?.avatar || user?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-[#172033] leading-tight">{user?.name || 'User'}</p>
                <p className="text-[10px] text-[#64748B] leading-tight">{user?.roleTitle || 'Operator'}</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
            </div>
          }
          items={[
            {
              label: user?.email || 'user@aquanexus.com',
              disabled: true,
            },
            { divider: true, label: '' },
            {
              label: 'Profile Settings',
              icon: <UserIcon />,
            },
            { divider: true, label: '' },
            {
              label: 'Logout',
              icon: <LogOut />,
              danger: true,
              onClick: logout,
            },
          ]}
        />
      </div>
    </header>
  );
}
