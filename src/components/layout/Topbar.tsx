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
  const { user, logout } = useAuth();

  const userInitial = user?.avatar || (user?.name ? user.name.trim().charAt(0).toUpperCase() : 'M');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white border-b border-[#E5E5E5] shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-lg text-[#666666] hover:bg-[#F5F5F5] hover:text-[#222222] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8F8F8] border border-[#E5E5E5]">
          <Building2 className="w-4 h-4 text-[#F97316]" />
          <span className="text-xs font-semibold text-[#222222]">
            {user?.plantName || 'AquaNexus Unit #1'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <button 
          className="relative p-2 rounded-lg text-[#666666] hover:bg-[#F5F5F5] hover:text-[#222222] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F97316]" />
        </button>

        <div className="h-5 w-px bg-[#E5E5E5] mx-1" />

        {/* Profile Avatar & Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <button 
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F97316] text-white font-bold text-xs shadow-xs hover:bg-[#EA580C] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F97316]/30 cursor-pointer"
              aria-label="User profile menu"
              title={user?.name || 'User Profile'}
            >
              {userInitial}
            </button>
          }
          items={[
            {
              label: `${user?.name || 'User'} (${user?.roleTitle || user?.role || 'Staff'})`,
              disabled: true,
            },
            {
              label: user?.email || 'user@aquanexus.com',
              disabled: true,
            },
            { divider: true, label: '' },
            {
              label: 'Profile Settings',
              icon: <UserIcon />,
              onClick: () => {},
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
