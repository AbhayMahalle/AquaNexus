import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Dropdown } from '@/components/ui/Dropdown';
import { Menu, User as UserIcon, LogOut, Building2, Bell } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TopbarProps {
  onMobileToggle?: () => void;
  theme?: 'default' | 'sample';
}

import { NotificationBell } from './NotificationBell';

export function Topbar({ onMobileToggle }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userInitial = user?.avatar || (user?.name ? user.name.trim().charAt(0).toUpperCase() : 'M');

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 border-b bg-white border-gray-200 shadow-none">
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-black"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-white border-gray-200 shadow-xs">
          <Building2 className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-semibold text-black">
            {user?.plantName || 'AquaNexus Unit #1'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell />

        <div className="h-5 w-px mx-1 bg-gray-200" />

        <Dropdown
          align="right"
          trigger={
            <button
              className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shadow-xs transition-colors focus:outline-none cursor-pointer bg-orange-500 text-black hover:bg-gray-200 focus:ring-2 focus:ring-orange-400/50"
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
              label: 'Profile',
              icon: <UserIcon className="w-4 h-4" />,
              onClick: () => { navigate('/profile'); },
            },
            { divider: true, label: '' },
            {
              label: 'Logout',
              icon: <LogOut className="w-4 h-4" />,
              danger: true,
              onClick: logout,
            },
          ]}
        />
      </div>
    </header>
  );
}