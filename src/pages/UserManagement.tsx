import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserRole } from '@/types/auth';
import { UserPlus, Search, Shield, Mail } from 'lucide-react';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  status: 'active' | 'inactive';
  plant: string;
}

const MOCK_USERS: UserRecord[] = [
  { id: '1', name: 'Mrudula Lead', email: 'admin@aquanexus.com', role: 'admin', roleTitle: 'System Lead / Frontend', status: 'active', plant: 'AquaNexus Unit #1' },
  { id: '2', name: 'Suresh Patil', email: 'manager@aquanexus.com', role: 'manager', roleTitle: 'Plant Operations Manager', status: 'active', plant: 'AquaNexus Unit #1' },
  { id: '3', name: 'Ram Store', email: 'store@aquanexus.com', role: 'store_manager', roleTitle: 'Store & Inventory Lead', status: 'active', plant: 'AquaNexus Unit #1' },
  { id: '4', name: 'Yash Finance', email: 'finance@aquanexus.com', role: 'accountant', roleTitle: 'Chief Accountant', status: 'active', plant: 'AquaNexus Unit #1' },
  { id: '5', name: 'Niranjan Dist', email: 'distributor@aquanexus.com', role: 'distributor', roleTitle: 'Distributor Agency Lead', status: 'active', plant: 'AquaNexus Unit #1' },
];

export default function UserManagementPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredUsers = MOCK_USERS.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.roleTitle.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<UserRecord>[] = [
    { key: 'name', header: 'Employee / User Name', render: (u) => <span className="font-bold text-[#172033]">{u.name}</span> },
    { key: 'email', header: 'Email Address', render: (u) => <span className="text-[#64748B] flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{u.email}</span> },
    { 
      key: 'role', 
      header: 'Role', 
      render: (u) => {
        const variants: Record<UserRole, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'neutral'> = {
          admin: 'primary',
          manager: 'secondary',
          store_manager: 'success',
          accountant: 'info',
          distributor: 'warning',
          operator: 'neutral',
        };
        return <Badge variant={variants[u.role]}>{u.role.toUpperCase()}</Badge>;
      } 
    },
    { key: 'roleTitle', header: 'Title / Department' },
    { key: 'plant', header: 'Plant Location' },
    { 
      key: 'status', 
      header: 'Status', 
      render: (u) => <Badge variant={u.status === 'active' ? 'success' : 'neutral'}>{u.status.toUpperCase()}</Badge> 
    },
  ];

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
            onClick: () => setIsModalOpen(true),
          }}
        />

        <Card className="mb-6">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0F4C81]" />
              <span>Registered System Users</span>
            </CardTitle>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search user, role, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={filteredUsers}
              emptyText="No matching users found"
            />
          </CardContent>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Create New User Account"
          description="Provision access to the AquaNexus Water ERP platform"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => { setIsModalOpen(false); alert('User created!'); }}>Provision Account</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Full Name" placeholder="e.g. Aniket Sharma" required />
            <Input label="Email Address" type="email" placeholder="e.g. aniket@aquanexus.com" required />
            <Select
              label="Assigned System Role"
              options={[
                { label: '👑 System Administrator', value: 'admin' },
                { label: '👔 Operations Manager', value: 'manager' },
                { label: '📦 Store & Inventory Manager (RAM)', value: 'store_manager' },
                { label: '💼 Accountant (YASH)', value: 'accountant' },
                { label: '🚚 Distributor (NIRANJAN)', value: 'distributor' },
                { label: '⚙️ Line Operator', value: 'operator' },
              ]}
            />
          </div>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
