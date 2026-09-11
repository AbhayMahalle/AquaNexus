import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserRole } from '@/lib/types';

export interface DashboardLayoutProps {
  children: React.ReactNode;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  currentRole,
  onRoleChange,
}) => {
  return (
    <div className="min-h-screen bg-bgMain flex">
      {/* Fixed Sidebar */}
      <Sidebar currentRole={currentRole} onRoleChange={onRoleChange} />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col pl-64 min-w-0">
        <Topbar currentRole={currentRole} />
        <main className="flex-1 p-6 overflow-y-auto animate-page-entry">{children}</main>
      </div>
    </div>
  );
};
