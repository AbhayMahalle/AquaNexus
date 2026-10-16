import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Dropdown } from '@/components/ui/Dropdown';
import {
  Menu,
  User as UserIcon,
  LogOut,
  Building2,
  Shield,
  PanelLeftOpen,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface TopbarProps {
  onMobileToggle?: () => void;
  collapsed?: boolean;
  onToggleSidebar?: () => void;
  theme?: 'default' | 'sample';
}

export function Topbar({
  onMobileToggle,
  collapsed = false,
  onToggleSidebar,
}: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userInitial = user?.avatar || (user?.name ? user.name.trim().charAt(0).toUpperCase() : 'M');

  return (
    <header
      className={`sticky top-0 z-30 flex items-center justify-between h-16 border-b bg-white border-gray-200 shadow-none ${
        collapsed ? 'pl-2.5 sm:pl-3 pr-4 sm:pr-6' : 'px-4 sm:px-6'
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onMobileToggle}
          className="lg:hidden p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-orange-400/50"
          aria-label="Toggle Navigation"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {onToggleSidebar && collapsed && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden lg:flex items-center justify-center p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-black focus:outline-none focus:ring-2 focus:ring-orange-400/50"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-5 h-5" />
          </button>
        )}

        {user?.isSuperAdmin ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-amber-50/70 border-amber-200 shadow-xs">
              <Shield className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-amber-900 truncate max-w-[130px] sm:max-w-none">
                Platform Admin
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border bg-white border-gray-200 shadow-xs max-w-[200px] sm:max-w-xs">
            <Building2 className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="text-xs font-semibold text-black truncate">
              {user?.organizationName || user?.plantName || 'AquaNexus Plant'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
          </div>
        )}
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
              onClick: () => {
                if (user?.role === 'super_admin' || user?.isSuperAdmin) {
                  navigate('/super-admin/profile');
                } else {
                  navigate('/profile');
                }
              },
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