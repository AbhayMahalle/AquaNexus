'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { fetchApi } from '@/services/apiClient';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import { showToast, exportToCSV } from '@/lib/api';
import { UserPlus, Search, Shield, Mail, Edit, Trash2, Eye, Download, X, Filter } from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  status: 'active' | 'inactive';
  plant: string;
  phone?: string;
  joinDate?: string;
}

const INITIAL_USERS: UserRecord[] = [];

const ITEMS_PER_PAGE = 5;

const ROLE_OPTIONS = [
  { label: '👔 Operations Manager', value: 'manager' },
  { label: '📦 Store & Inventory Manager', value: 'store_manager' },
  { label: '💼 Accountant', value: 'accountant' },
  { label: '🚚 Distributor', value: 'distributor' },
  { label: '🏭 Vendor / Supplier', value: 'supplier' },
  { label: '⚙️ Employee', value: 'employee' },
];

const ROLE_VARIANTS: Record<UserRole, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'neutral'> = {
  super_admin: 'warning',
  admin: 'primary',
  manager: 'secondary',
  store_manager: 'success',
  accountant: 'info',
  distributor: 'warning',
  supplier: 'warning',
  employee: 'neutral',
};

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const isManager = currentUser?.role === 'manager';
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);

  // Subscription Entitlement State
  const [subscription, setSubscription] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee' as UserRole,
    phone: '',
    plant: 'AquaNexus Unit #1',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchSubscription = async () => {
    try {
      const res = await fetchApi<any>('/company/subscription');
      if (res.success && res.data) {
        setSubscription(res.data.subscription || res.data);
      }
    } catch (e) {
      console.error('Failed to load company subscription:', e);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetchApi<{ users: any[] }>('/users');
      if (res.success && res.data) {
        const raw = res.data.users || (Array.isArray(res.data) ? res.data : []);
        const mapped: UserRecord[] = raw.map((u: any) => {
          const roleName = (u.role?.name || u.userRoles?.[0]?.role?.name || '').toLowerCase();
          let mappedRole: UserRole = 'employee';
          if (roleName === 'super_admin') mappedRole = 'super_admin';
          else if (roleName === 'admin') mappedRole = 'admin';
          else if (roleName === 'manager') mappedRole = 'manager';
          else if (roleName === 'store_manager') mappedRole = 'store_manager';
          else if (roleName === 'accountant') mappedRole = 'accountant';
          else if (roleName === 'distributor') mappedRole = 'distributor';
          else if (roleName === 'supplier' || roleName === 'vendor') mappedRole = 'supplier';

          return {
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.email,
            email: u.email,
            role: mappedRole,
            roleTitle: mappedRole === 'admin' ? 'Company Administrator' : mappedRole === 'super_admin' ? 'Platform SuperAdmin' : u.role?.name === 'SUPPLIER' ? 'Vendor / Supplier' : (u.role?.description || u.role?.name || (mappedRole === 'supplier' ? 'Vendor / Supplier' : mappedRole)),
            status: u.status === 'ACTIVE' ? 'active' : 'inactive',
            plant: 'AquaNexus Unit #1',
            phone: u.phone || '',
            joinDate: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : '2026-09-04',
          };
        });
        setUsers(mapped);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSubscription();
  }, []);

  // Filtering and search
  const filteredUsers = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.roleTitle.toLowerCase().includes(q)
      );
    }
    if (roleFilter) {
      result = result.filter(u => u.role === roleFilter);
    }
    if (statusFilter) {
      result = result.filter(u => u.status === statusFilter);
    }
    return result;
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1); };
  const handleRoleFilter = (e: React.ChangeEvent<HTMLSelectElement>) => { setRoleFilter(e.target.value); setCurrentPage(1); };
  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => { setStatusFilter(e.target.value); setCurrentPage(1); };
  const clearFilters = () => { setSearch(''); setRoleFilter(''); setStatusFilter(''); setCurrentPage(1); };
  const hasActiveFilters = search || roleFilter || statusFilter;

  // Validation
  const validateForm = (isNewUser = false): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (isNewUser) {
      if (!formData.password) errors.password = 'Initial password is required';
      else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create user
  const handleCreate = async () => {
    if (!validateForm(true)) return;
    setIsSaving(true);
    try {
      const names = formData.name.trim().split(/\s+/);
      const firstName = names[0] || 'User';
      const lastName = names.slice(1).join(' ') || firstName;
      const roleName = isManager ? 'EMPLOYEE' : formData.role.toUpperCase();

      const payload = {
        username: (formData.email.split('@')[0] + Date.now().toString().slice(-4)).toLowerCase(),
        email: formData.email,
        password: formData.password,
        firstName,
        lastName,
        phone: formData.phone || '',
        roleId: roleName,
      };

      const res = await fetchApi<any>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        await fetchUsers();
        await fetchSubscription();
        setIsCreateOpen(false);
        resetForm();
        showToast(`User "${formData.name}" created successfully`, 'success');
      } else {
        const errorMsg = (res as any).message || (res as any).error || 'Failed to create user';
        showToast(errorMsg, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Edit user
  const openEdit = (user: UserRecord) => {
    if (isManager && user.role !== 'employee') {
      showToast('Managers are only permitted to modify Employee accounts', 'error');
      return;
    }
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, password: '', role: user.role, phone: user.phone || '', plant: user.plant });
    setFormErrors({});
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!validateForm() || !selectedUser) return;
    setIsSaving(true);
    try {
      const names = formData.name.trim().split(/\s+/);
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || firstName;
      const roleId = isManager ? 'EMPLOYEE' : formData.role.toUpperCase();

      const res = await fetchApi<any>(`/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          email: formData.email,
          firstName,
          lastName,
          phone: formData.phone,
          roleId,
        }),
      });

      if (res.success) {
        await fetchUsers();
        setIsEditOpen(false);
        setSelectedUser(null);
        resetForm();
        showToast('User updated successfully', 'success');
      } else {
        showToast(res.message || 'Failed to update user', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // View details
  const openView = (user: UserRecord) => { setSelectedUser(user); setIsViewOpen(true); };

  // Delete user
  const openDelete = (user: UserRecord) => {
    if (isManager && user.role !== 'employee') {
      showToast('Managers are only permitted to remove Employee accounts', 'error');
      return;
    }
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };
  const handleDelete = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const res = await fetchApi<any>(`/users/${selectedUser.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SUSPENDED' }),
      });
      if (res.success) {
        await fetchUsers();
        setIsDeleteOpen(false);
        setSelectedUser(null);
        showToast(`User "${selectedUser.name}" deactivated`, 'info');
      } else {
        showToast(res.message || 'Failed to deactivate user', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle status
  const toggleStatus = async (user: UserRecord) => {
    if (isManager && user.role !== 'employee') {
      return;
    }
    const newStatus = user.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    const res = await fetchApi<any>(`/users/${user.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.success) {
      await fetchUsers();
      showToast(`${user.name} is now ${newStatus.toLowerCase()}`, newStatus === 'ACTIVE' ? 'success' : 'warning');
    } else {
      showToast(res.message || 'Failed to update status', 'error');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'employee', phone: '', plant: 'AquaNexus Unit #1' });
    setFormErrors({});
  };

  // Export
  const handleExport = () => {
    exportToCSV(filteredUsers, [
      { key: 'name', header: 'Full Name' },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role' },
      { key: 'roleTitle', header: 'Title' },
      { key: 'status', header: 'Status' },
    ], 'aquanexus_users');
  };

  const columns: Column<UserRecord>[] = [
    { key: 'name', header: 'Full Name', render: (u) => <span className="font-bold text-[#172033]">{u.name}</span> },
    { key: 'email', header: 'Email Address', render: (u) => <span className="text-[#64748B] flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />{u.email}</span> },
    {
      key: 'role',
      header: 'System Role',
      render: (u) => (
        <Badge variant={ROLE_VARIANTS[u.role]}>
          {u.role === 'supplier' ? 'VENDOR / SUPPLIER' : u.role.replace('_', ' ').toUpperCase()}
        </Badge>
      ),
    },
    { key: 'roleTitle', header: 'Position / Department' },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <button
          onClick={() => (!isManager || u.role === 'employee') && toggleStatus(u)}
          className={(!isManager || u.role === 'employee') ? "cursor-pointer" : "cursor-default"}
          title={isManager && u.role !== 'employee' ? "Only admin can toggle non-employee accounts" : undefined}
        >
          <Badge variant={u.status === 'active' ? 'success' : 'neutral'}>{u.status.toUpperCase()}</Badge>
        </button>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => openView(u)} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#EFF3F8] transition-colors" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          {(!isManager || u.role === 'employee') && (
            <>
              <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F4C81] hover:bg-[#E6EFF7] transition-colors" title="Edit User">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => openDelete(u)} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors" title="Delete User">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const formFields = (
    <div className="space-y-4">
      <Input label="Full Name" placeholder="e.g. Aniket Sharma" required value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} error={formErrors.name} />
      <Input label="Email Address" type="email" placeholder="e.g. aniket@aquanexus.com" required value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} error={formErrors.email} />
      {isCreateOpen && (
        <Input
          label="Account Password"
          type="password"
          placeholder="••••••••"
          required
          value={formData.password}
          onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
          error={formErrors.password}
          helperText="Minimum 6 characters"
        />
      )}
      <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} />
      <Select
        label="Assigned System Role"
        value={formData.role}
        disabled={isManager}
        onChange={(e) => setFormData(f => ({ ...f, role: e.target.value as UserRole }))}
        options={
          isManager
            ? [{ label: '⚙️ Employee', value: 'employee' }]
            : ROLE_OPTIONS.filter((option) => currentUser?.role === 'super_admin' || option.value !== 'super_admin')
        }
      />
      
      {/* Role Quota Indicator */}
      {formData.role === 'employee' ? (
        <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <span>✓</span>
          <span>Unlimited role: Employees never consume subscription quota on any plan.</span>
        </div>
      ) : formData.role === 'admin' ? (
        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center gap-2">
          <span>ℹ</span>
          <span>Single-Admin Rule: Exactly 1 company Admin is permitted per organization.</span>
        </div>
      ) : subscription?.roleLimits?.[formData.role.toUpperCase()] ? (
        (() => {
          const rLimit = subscription.roleLimits[formData.role.toUpperCase()];
          return (
            <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 border ${
              rLimit.isLimitReached
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-blue-50/60 border-blue-100 text-blue-900'
            }`}>
              <span>Quota for {rLimit.roleName}: <strong>{rLimit.currentUsage} / {rLimit.maxLimit}</strong> accounts</span>
              {rLimit.isLimitReached && (
                <span className="font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px]">
                  Limit Reached • Upgrade Required
                </span>
              )}
            </div>
          );
        })()
      ) : null}

      <Input label="Plant Location" value={formData.plant} onChange={(e) => setFormData(f => ({ ...f, plant: e.target.value }))} />
    </div>
  );

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <PageHeader
          title="User & Staff Management"
          description="Manage system access, roles, and employee permissions across plant operations"
          breadcrumbs={[{ label: 'Admin' }, { label: 'Users' }]}
          primaryAction={{
            label: 'Add New User',
            icon: <UserPlus className="w-4 h-4" />,
            variant: 'primary',
            onClick: () => {
              resetForm();
              setIsCreateOpen(true);
            },
          }}
          secondaryActions={[
            {
              label: 'Export CSV',
              icon: <Download className="w-4 h-4" />,
              variant: 'outline',
              onClick: handleExport,
            }
          ]}
        />

        {/* Subscription Entitlement Bar with Per-Role Breakdown */}
        {subscription && (
          <div className="mb-6 p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Plan:</span>
                <Badge variant={subscription.plan?.code === 'PRO_MAX' ? 'primary' : subscription.plan?.code === 'PRO' ? 'success' : 'neutral'} className="font-bold">
                  {subscription.plan?.name || 'Basic Plan'}
                </Badge>
                <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {subscription.status}
                </Badge>
                <span className="text-xs text-gray-500">
                  {subscription.plan?.code === 'BASIC'
                    ? '1 Admin • Unlimited Employees • Max 1 user per business role'
                    : subscription.plan?.code === 'PRO'
                      ? '1 Admin • Unlimited Employees • Max 5 users per business role'
                      : '1 Admin • Unlimited Employees • Custom per-role limits'}
                </span>
              </div>
            </div>

            {/* Per-role entitlement pills */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-blue-100/60">
              <span className="text-xs font-medium text-gray-600">Role Entitlements:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-gray-200 text-gray-700 shadow-sm">
                👑 Admin: <strong className="text-primary">1 / 1</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm">
                ⚙️ Employees: <strong>Unlimited</strong> ({subscription.employeeCount ?? 0} active)
              </span>
              {subscription.roleBreakdown?.filter((r: any) => r.isBusinessRole).map((r: any) => (
                <span
                  key={r.roleName}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shadow-sm ${
                    r.isLimitReached
                      ? 'bg-amber-50 border border-amber-300 text-amber-900 font-semibold'
                      : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  <span>{r.roleName}:</span>
                  <strong className={r.isLimitReached ? 'text-amber-700' : 'text-gray-900'}>
                    {r.currentUsage} / {r.maxLimit}
                  </strong>
                  {r.isLimitReached && (
                    <span className="text-[10px] px-1 py-0.2 bg-amber-200 text-amber-900 rounded font-bold uppercase">
                      Full
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        <Card className="mb-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0F4C81]" />
              <span>Registered System Users ({filteredUsers.length})</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-56">
                <Input
                  placeholder="Search user, role, email..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />}
                />
              </div>
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <Select
                  value={roleFilter}
                  onChange={handleRoleFilter}
                  placeholder="All Roles"
                  options={[
                    { label: 'All Roles', value: '' },
                    { label: 'Admin', value: 'admin' },
                    { label: 'Manager', value: 'manager' },
                    { label: 'Store Manager', value: 'store_manager' },
                    { label: 'Accountant', value: 'accountant' },
                    { label: 'Distributor', value: 'distributor' },
                    { label: 'Vendor / Supplier', value: 'supplier' },
                    { label: 'Employee', value: 'employee' },
                  ]}
                  className="!w-44"
                />
                <Select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  placeholder="All Statuses"
                  options={[
                    { label: 'All Statuses', value: '' },
                    { label: 'Active', value: 'active' },
                    { label: 'Inactive', value: 'inactive' },
                  ]}
                  className="!w-32"
                />
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="w-3.5 h-3.5" />}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={paginatedUsers}
              emptyText="No matching users found"
              emptyDescription="Try adjusting your search or filter criteria"
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>

        {/* Create User Modal */}
        <Modal
          isOpen={isCreateOpen}
          onClose={() => { setIsCreateOpen(false); resetForm(); }}
          title="Create New User Account"
          description="Provision access to the AquaNexus Water ERP platform"
          footer={
            <>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</Button>
              <Button variant="primary" onClick={handleCreate} loading={isSaving}>Provision Account</Button>
            </>
          }
        >
          {formFields}
        </Modal>

        {/* Edit User Modal */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => { setIsEditOpen(false); setSelectedUser(null); resetForm(); }}
          title={`Edit User: ${selectedUser?.name || ''}`}
          description="Update user details and role assignment"
          footer={
            <>
              <Button variant="outline" onClick={() => { setIsEditOpen(false); setSelectedUser(null); resetForm(); }}>Cancel</Button>
              <Button variant="primary" onClick={handleEdit} loading={isSaving}>Save Changes</Button>
            </>
          }
        >
          {formFields}
        </Modal>

        {/* View User Modal */}
        <Modal
          isOpen={isViewOpen}
          onClose={() => { setIsViewOpen(false); setSelectedUser(null); }}
          title={`User Details: ${selectedUser?.name || ''}`}
          description="Complete user profile information"
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-3.5 p-4 rounded-xl bg-[#F5F8FB] border border-[#E2E8F0]">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0F4C81] text-white text-lg font-bold">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-base font-bold text-[#172033]">{selectedUser.name}</p>
                  <p className="text-xs text-[#64748B]">{selectedUser.roleTitle}</p>
                  <Badge variant={ROLE_VARIANTS[selectedUser.role]} size="sm" className="mt-1">
                    {selectedUser.role === 'supplier' ? 'VENDOR / SUPPLIER' : selectedUser.role.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-[#64748B] font-semibold">Email</p><p className="text-[#172033]">{selectedUser.email}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Phone</p><p className="text-[#172033]">{selectedUser.phone || '—'}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Plant</p><p className="text-[#172033]">{selectedUser.plant}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Status</p><Badge variant={selectedUser.status === 'active' ? 'success' : 'neutral'}>{selectedUser.status.toUpperCase()}</Badge></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Joined</p><p className="text-[#172033]">{selectedUser.joinDate || '—'}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">User ID</p><p className="text-[#172033] font-mono text-xs">{selectedUser.id}</p></div>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={isDeleteOpen}
          onClose={() => { setIsDeleteOpen(false); setSelectedUser(null); }}
          title="Confirm User Removal"
          description={`Are you sure you want to remove "${selectedUser?.name}"? This action cannot be undone.`}
          size="sm"
          footer={
            <>
              <Button variant="outline" onClick={() => { setIsDeleteOpen(false); setSelectedUser(null); }}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={isSaving}>Remove User</Button>
            </>
          }
        >
          <div className="p-3 rounded-lg bg-[#FEF2F2] border border-[#DC2626]/20 text-sm text-[#DC2626]">
            <p className="font-semibold">⚠️ Warning</p>
            <p className="text-xs mt-1">Removing this user will revoke their access to the AquaNexus ERP system. All their assignments and permissions will be cleared.</p>
          </div>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}