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

const INITIAL_USERS: UserRecord[] = [
  { id: '1', name: 'Mrudula Lead', email: 'admin@aquanexus.com', role: 'admin', roleTitle: 'System Lead / Frontend', status: 'active', plant: 'AquaNexus Unit #1', phone: '+91 98765 43210', joinDate: '2024-01-15' },
  { id: '2', name: 'Suresh Patil', email: 'manager@aquanexus.com', role: 'manager', roleTitle: 'Plant Operations Manager', status: 'active', plant: 'AquaNexus Unit #1', phone: '+91 98765 43211', joinDate: '2024-02-01' },
  { id: '3', name: 'Ram Store', email: 'store@aquanexus.com', role: 'store_manager', roleTitle: 'Store & Inventory Lead', status: 'active', plant: 'AquaNexus Unit #1', phone: '+91 98765 43212', joinDate: '2024-03-10' },
  { id: '4', name: 'Yash Finance', email: 'finance@aquanexus.com', role: 'accountant', roleTitle: 'Chief Accountant', status: 'active', plant: 'AquaNexus Unit #1', phone: '+91 98765 43213', joinDate: '2024-04-05' },
  { id: '5', name: 'Niranjan Dist', email: 'distributor@aquanexus.com', role: 'distributor', roleTitle: 'Distributor Agency Lead', status: 'active', plant: 'AquaNexus Unit #1', phone: '+91 98765 43214', joinDate: '2024-05-20' },
  { id: '6', name: 'Ramesh K.', email: 'ramesh@aquanexus.com', role: 'employee', roleTitle: 'Line Operator', status: 'active', plant: 'AquaNexus Unit #1', phone: '+91 98765 43215', joinDate: '2024-06-01' },
  { id: '7', name: 'Sunil P.', email: 'sunil@aquanexus.com', role: 'employee', roleTitle: 'Filling Line Technician', status: 'active', plant: 'AquaNexus Unit #1', phone: '+91 98765 43216', joinDate: '2024-06-15' },
  { id: '8', name: 'Priya M.', email: 'priya@aquanexus.com', role: 'manager', roleTitle: 'Quality Manager', status: 'inactive', plant: 'AquaNexus Unit #2', phone: '+91 98765 43217', joinDate: '2024-07-01' },
];

const ITEMS_PER_PAGE = 5;

const ROLE_OPTIONS = [
  { label: '👑 System Administrator', value: 'admin' },
  { label: '👔 Operations Manager', value: 'manager' },
  { label: '📦 Store & Inventory Manager (RAM)', value: 'store_manager' },
  { label: '💼 Accountant (YASH)', value: 'accountant' },
  { label: '🚚 Distributor (NIRANJAN)', value: 'distributor' },
  { label: '⚙️ Line Operator', value: 'operator' },
];

const ROLE_VARIANTS: Record<UserRole, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'neutral'> = {
  admin: 'primary',
  manager: 'secondary',
  store_manager: 'success',
  accountant: 'info',
  distributor: 'warning',
  employee: 'neutral',
};

export default function UserManagementPage() {
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

  // Form state
  const [formData, setFormData] = useState({ name: '', email: '', role: 'employee' as UserRole, phone: '', plant: 'AquaNexus Unit #1' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetchApi<{ users: any[] }>('/users');
      if (res.success && res.data) {
        const raw = res.data.users || (Array.isArray(res.data) ? res.data : []);
        const mapped: UserRecord[] = raw.map((u: any) => {
          const roleName = (u.role?.name || u.userRoles?.[0]?.role?.name || '').toLowerCase();
          let mappedRole: UserRole = 'employee';
          if (roleName === 'admin') mappedRole = 'admin';
          else if (roleName === 'manager') mappedRole = 'manager';
          else if (roleName === 'store_manager') mappedRole = 'store_manager';
          else if (roleName === 'accountant') mappedRole = 'accountant';
          else if (roleName === 'distributor') mappedRole = 'distributor';

          return {
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username || u.email,
            email: u.email,
            role: mappedRole,
            roleTitle: u.role?.description || u.role?.name || mappedRole,
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
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const roleMap: Record<string, string> = {
    admin: '9fef54ac-4b08-4213-a6b7-4272d193d818',
    manager: 'b554c73c-16b8-40f8-ba3a-298d3af39e89',
    store_manager: 'c2dcdbe3-2766-4f86-b8d3-adf1005b6827',
    accountant: 'bae5fff7-59b5-47c6-9d7f-73bfc0dfa773',
    distributor: '8af0c503-111a-465d-a8d2-91f0c95b5e14',
  };

  // Create user
  const handleCreate = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    try {
      const names = formData.name.trim().split(/\s+/);
      const firstName = names[0] || 'User';
      const lastName = names.slice(1).join(' ') || firstName;
      const roleId = roleMap[formData.role] || roleMap.admin;

      const payload = {
        username: (formData.email.split('@')[0] + Date.now().toString().slice(-4)).toLowerCase(),
        email: formData.email,
        password: 'Password@123',
        firstName,
        lastName,
        phone: formData.phone || '9876543210',
        roleId,
      };

      const res = await fetchApi<any>('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        await fetchUsers();
        setIsCreateOpen(false);
        resetForm();
        showToast(`User "${formData.name}" created successfully`, 'success');
      } else {
        showToast(res.message || 'Failed to create user', 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Edit user
  const openEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, phone: user.phone || '', plant: user.plant });
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
      const roleId = roleMap[formData.role] || roleMap.admin;

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
  const openDelete = (user: UserRecord) => { setSelectedUser(user); setIsDeleteOpen(true); };
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
    setFormData({ name: '', email: '', role: 'employee', phone: '', plant: 'AquaNexus Unit #1' });
    setFormErrors({});
  };

  // Export
  const handleExport = () => {
    exportToCSV(filteredUsers, [
      { key: 'name', header: 'Name' },
      { key: 'email', header: 'Email' },
      { key: 'role', header: 'Role' },
      { key: 'roleTitle', header: 'Title' },
      { key: 'status', header: 'Status' },
      { key: 'plant', header: 'Plant' },
    ], 'aquanexus_users');
  };

  const columns: Column<UserRecord>[] = [
    { key: 'name', header: 'Employee', render: (u) => <span className="font-bold text-[#172033]">{u.name}</span> },
    { key: 'email', header: 'Email Address', render: (u) => <span className="text-[#64748B] flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />{u.email}</span> },
    {
      key: 'role',
      header: 'System Role',
      render: (u) => <Badge variant={ROLE_VARIANTS[u.role]}>{u.role.replace('_', ' ').toUpperCase()}</Badge>
    },
    { key: 'roleTitle', header: 'Position / Department' },
    { key: 'plant', header: 'Operating Unit' },
    {
      key: 'status',
      header: 'Status',
      render: (u) => (
        <button onClick={() => toggleStatus(u)} className="cursor-pointer">
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
          <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F4C81] hover:bg-[#E6EFF7] transition-colors" title="Edit User">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => openDelete(u)} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors" title="Delete User">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const formFields = (
    <div className="space-y-4">
      <Input label="Full Name" placeholder="e.g. Aniket Sharma" required value={formData.name} onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))} error={formErrors.name} />
      <Input label="Email Address" type="email" placeholder="e.g. aniket@aquanexus.com" required value={formData.email} onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))} error={formErrors.email} />
      <Input label="Phone Number" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData(f => ({ ...f, phone: e.target.value }))} />
      <Select label="Assigned System Role" value={formData.role} onChange={(e) => setFormData(f => ({ ...f, role: e.target.value as UserRole }))} options={ROLE_OPTIONS} />
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
            onClick: () => { resetForm(); setIsCreateOpen(true); },
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
                  ]}
                  className="!w-36"
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
                  <Badge variant={ROLE_VARIANTS[selectedUser.role]} size="sm" className="mt-1">{selectedUser.role.replace('_', ' ').toUpperCase()}</Badge>
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