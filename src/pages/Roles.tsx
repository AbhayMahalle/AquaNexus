import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { showToast } from '@/lib/api';
import { Permission } from '@/types/auth';
import { ShieldCheck, Edit, Plus, Users, Check, X as XIcon, Save } from 'lucide-react';

interface RoleConfig {
  title: string;
  code: string;
  users: number;
  desc: string;
  badge: 'primary' | 'secondary' | 'success' | 'info' | 'warning';
  permissions: Permission[];
}

const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: 'users.view', label: 'View Users', group: 'User Management' },
  { key: 'users.manage', label: 'Manage Users', group: 'User Management' },
  { key: 'roles.view', label: 'View Roles', group: 'Roles & Security' },
  { key: 'roles.manage', label: 'Manage Roles', group: 'Roles & Security' },
  { key: 'production.view', label: 'View Production', group: 'Production' },
  { key: 'production.manage', label: 'Manage Production', group: 'Production' },
  { key: 'inventory.view', label: 'View Inventory', group: 'Inventory' },
  { key: 'inventory.manage', label: 'Manage Inventory', group: 'Inventory' },
  { key: 'sales.view', label: 'View Sales', group: 'Sales & Distribution' },
  { key: 'sales.manage', label: 'Manage Sales', group: 'Sales & Distribution' },
  { key: 'finance.view', label: 'View Finance', group: 'Finance' },
  { key: 'finance.manage', label: 'Manage Finance', group: 'Finance' },
  { key: 'reports.view', label: 'View Reports', group: 'Reports' },
  { key: 'reports.manage', label: 'Manage Reports', group: 'Reports' },
  { key: 'attendance.view', label: 'View Attendance', group: 'Attendance & HR' },
  { key: 'attendance.manage', label: 'Manage Attendance', group: 'Attendance & HR' },
];

const INITIAL_ROLES: RoleConfig[] = [
  {
    title: 'Admin', code: 'admin', users: 2, badge: 'primary',
    desc: 'Full unrestricted system configuration and audit access',
    permissions: ALL_PERMISSIONS.map(p => p.key),
  },
  {
    title: 'Operations Manager', code: 'manager', users: 5, badge: 'secondary',
    desc: 'Manages production line, inventory, attendance, and logs',
    permissions: ['production.view', 'production.manage', 'inventory.view', 'inventory.manage', 'reports.view', 'attendance.view', 'attendance.manage'],
  },
  {
    title: 'Store Manager (RAM)', code: 'store_manager', users: 3, badge: 'success',
    desc: 'Stock entry, raw material tracking, purchase requisitions',
    permissions: ['inventory.view', 'inventory.manage', 'reports.view'],
  },
  {
    title: 'Chief Accountant (YASH)', code: 'accountant', users: 4, badge: 'info',
    desc: 'Billing, sales ledgers, distributor payments, financial reports',
    permissions: ['finance.view', 'finance.manage', 'sales.view', 'reports.view'],
  },
  {
    title: 'Distributor (NIRANJAN)', code: 'distributor', users: 18, badge: 'warning',
    desc: 'Agency ordering, jar deliveries, collection updates',
    permissions: ['sales.view', 'sales.manage', 'reports.view'],
  },
];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleConfig[]>(INITIAL_ROLES);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleConfig | null>(null);
  const [editPermissions, setEditPermissions] = useState<Permission[]>([]);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRolePerms, setNewRolePerms] = useState<Permission[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const openEditRights = (role: RoleConfig) => {
    setEditingRole(role);
    setEditPermissions([...role.permissions]);
    setIsEditOpen(true);
  };

  const togglePermission = (perm: Permission, list: Permission[], setter: (p: Permission[]) => void) => {
    setter(list.includes(perm) ? list.filter(p => p !== perm) : [...list, perm]);
  };

  const handleSavePermissions = async () => {
    if (!editingRole) return;
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setRoles(prev => prev.map(r => r.code === editingRole.code ? { ...r, permissions: editPermissions } : r));
    setIsEditOpen(false);
    setEditingRole(null);
    setIsSaving(false);
    showToast(`Permissions updated for ${editingRole.title}`, 'success');
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      showToast('Please enter a role name', 'warning');
      return;
    }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));
    const newRole: RoleConfig = {
      title: newRoleName,
      code: newRoleName.toLowerCase().replace(/\s+/g, '_'),
      users: 0,
      desc: newRoleDesc || `Custom role: ${newRoleName}`,
      badge: 'secondary',
      permissions: newRolePerms,
    };
    setRoles(prev => [...prev, newRole]);
    setIsCreateOpen(false);
    setNewRoleName('');
    setNewRoleDesc('');
    setNewRolePerms([]);
    setIsSaving(false);
    showToast(`Role "${newRoleName}" created`, 'success');
  };

  // Group permissions by category
  const permissionGroups = ALL_PERMISSIONS.reduce<Record<string, typeof ALL_PERMISSIONS>>((acc, p) => {
    (acc[p.group] = acc[p.group] || []).push(p);
    return acc;
  }, {});

  const renderPermissionGrid = (selectedPerms: Permission[], setter: (p: Permission[]) => void, isAdmin: boolean = false) => (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
      {Object.entries(permissionGroups).map(([group, perms]) => (
        <div key={group}>
          <h4 className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">{group}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {perms.map((perm) => {
              const isEnabled = selectedPerms.includes(perm.key);
              return (
                <button
                  key={perm.key}
                  disabled={isAdmin}
                  onClick={() => togglePermission(perm.key, selectedPerms, setter)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border ${
                    isEnabled
                      ? 'bg-[#0F4C81]/10 border-[#0F4C81]/30 text-[#0F4C81]'
                      : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                  } ${isAdmin ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isEnabled ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <XIcon className="w-3.5 h-3.5 text-[#CBD5E1]" />}
                  <span>{perm.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <PageHeader
          title="Roles & Security Governance"
          description="Define role hierarchies, access levels, and module permissions"
          breadcrumbs={[{ label: 'Admin' }, { label: 'Roles' }]}
          primaryAction={{
            label: 'Create Custom Role',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setIsCreateOpen(true),
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.code} variant="interactive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Badge variant={role.badge}>{role.title}</Badge>
                <span className="text-xs font-semibold text-[#64748B] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {role.users} Active
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[#64748B] leading-relaxed">{role.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 4).map(p => (
                    <span key={p} className="px-2 py-0.5 text-[10px] font-mono bg-[#F5F8FB] text-[#0F4C81] rounded-md border border-[#E2E8F0]">
                      {p}
                    </span>
                  ))}
                  {role.permissions.length > 4 && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold text-[#64748B] bg-[#F8FAFC] rounded-md border border-[#E2E8F0]">
                      +{role.permissions.length - 4} more
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                  <span className="text-[11px] font-mono text-[#0F4C81] font-bold">ROLE_{role.code.toUpperCase()}</span>
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />} onClick={() => openEditRights(role)}>
                    Edit Rights
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Permissions Modal */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setEditingRole(null); }}
          title={`Edit Permissions: ${editingRole?.title || ''}`}
          description={editingRole?.code === 'admin' ? 'Admin role has all permissions by default' : 'Toggle module-level access rights for this role'}
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => { setIsEditOpen(false); setEditingRole(null); }}>Cancel</Button>
              <Button variant="primary" onClick={handleSavePermissions} loading={isSaving} leftIcon={<Save className="w-4 h-4" />}>
                Save Permissions
              </Button>
            </>
          }
        >
          {renderPermissionGrid(editPermissions, setEditPermissions, editingRole?.code === 'admin')}
        </Modal>

        {/* Create Role Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); setNewRoleName(''); setNewRoleDesc(''); setNewRolePerms([]); }}
          title="Create Custom Role"
          description="Define a new role with specific module permissions"
          size="lg"
          footer={
            <>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); setNewRoleName(''); setNewRoleDesc(''); setNewRolePerms([]); }}>Cancel</Button>
              <Button variant="primary" onClick={handleCreateRole} loading={isSaving} leftIcon={<ShieldCheck className="w-4 h-4" />}>
                Create Role
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Role Name" placeholder="e.g. Shift Supervisor" required value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} />
            <Input label="Description" placeholder="Brief description of this role's responsibilities" value={newRoleDesc} onChange={(e) => setNewRoleDesc(e.target.value)} />
            <div className="border-t border-[#E2E8F0] pt-4">
              <h4 className="text-xs font-bold text-[#172033] mb-3">Assign Permissions</h4>
              {renderPermissionGrid(newRolePerms, setNewRolePerms)}
            </div>
          </div>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
