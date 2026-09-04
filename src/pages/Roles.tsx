import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ShieldCheck, Edit } from 'lucide-react';

export default function RolesPage() {
  const rolesList = [
    { title: 'Admin', code: 'admin', users: 2, desc: 'Full unrestricted system configuration and audit access', badge: 'primary' as const },
    { title: 'Operations Manager', code: 'manager', users: 5, desc: 'Manages production line, inventory, attendance, and logs', badge: 'secondary' as const },
    { title: 'Store Manager (RAM)', code: 'store_manager', users: 3, desc: 'Stock entry, raw material tracking, purchase requisitions', badge: 'success' as const },
    { title: 'Chief Accountant (YASH)', code: 'accountant', users: 4, desc: 'Billing, sales ledgers, distributor payments, financial reports', badge: 'info' as const },
    { title: 'Distributor (NIRANJAN)', code: 'distributor', users: 18, desc: 'Agency ordering, jar deliveries, collection updates', badge: 'warning' as const },
  ];

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <PageHeader
          title="Roles & Security Governance"
          description="Define role hierarchies, access levels, and module permissions"
          breadcrumbs={[{ label: 'Admin' }, { label: 'Roles' }]}
          primaryAction={{
            label: 'Create Custom Role',
            icon: <ShieldCheck className="w-4 h-4" />,
            onClick: () => alert('Custom role creator opens...'),
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rolesList.map((role) => (
            <Card key={role.code} variant="interactive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Badge variant={role.badge}>{role.title}</Badge>
                <span className="text-xs font-semibold text-[#64748B]">{role.users} Active Users</span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[#64748B] leading-relaxed">{role.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
                  <span className="text-[11px] font-mono text-[#0F4C81] font-bold">ROLE_{role.code.toUpperCase()}</span>
                  <Button variant="ghost" size="sm" leftIcon={<Edit className="w-3.5 h-3.5" />}>
                    Edit Rights
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
