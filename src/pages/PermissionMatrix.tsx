import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Check, X, Lock } from 'lucide-react';

interface MatrixRow {
  module: string;
  admin: boolean;
  manager: boolean;
  store: boolean;
  accountant: boolean;
  distributor: boolean;
}

const MATRIX_DATA: MatrixRow[] = [
  { module: 'User & Role Security Management', admin: true, manager: false, store: false, accountant: false, distributor: false },
  { module: 'Production Batch Entry & Telemetry', admin: true, manager: true, store: false, accountant: false, distributor: false },
  { module: 'Store & Inventory Management (RAM)', admin: true, manager: true, store: true, accountant: false, distributor: false },
  { module: 'Employee Attendance & Payroll (NIRANJAN)', admin: true, manager: true, store: false, accountant: true, distributor: false },
  { module: 'Financial Ledgers & Invoicing (YASH)', admin: true, manager: false, store: false, accountant: true, distributor: false },
  { module: 'Distributor Order Dispatch', admin: true, manager: true, store: true, accountant: false, distributor: true },
];

export default function PermissionMatrixPage() {
  const columns: Column<MatrixRow>[] = [
    { key: 'module', header: 'ERP Functional Module', render: (r) => <span className="font-bold text-[#172033]">{r.module}</span> },
    { key: 'admin', header: 'Admin', align: 'center', render: (r) => r.admin ? <Check className="w-5 h-5 text-[#16A34A] mx-auto" /> : <X className="w-4 h-4 text-[#94A3B8] mx-auto" /> },
    { key: 'manager', header: 'Manager', align: 'center', render: (r) => r.manager ? <Check className="w-5 h-5 text-[#16A34A] mx-auto" /> : <X className="w-4 h-4 text-[#94A3B8] mx-auto" /> },
    { key: 'store', header: 'Store Mgr', align: 'center', render: (r) => r.store ? <Check className="w-5 h-5 text-[#16A34A] mx-auto" /> : <X className="w-4 h-4 text-[#94A3B8] mx-auto" /> },
    { key: 'accountant', header: 'Accountant', align: 'center', render: (r) => r.accountant ? <Check className="w-5 h-5 text-[#16A34A] mx-auto" /> : <X className="w-4 h-4 text-[#94A3B8] mx-auto" /> },
    { key: 'distributor', header: 'Distributor', align: 'center', render: (r) => r.distributor ? <Check className="w-5 h-5 text-[#16A34A] mx-auto" /> : <X className="w-4 h-4 text-[#94A3B8] mx-auto" /> },
  ];

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <PageHeader
          title="Permission Matrix Matrix"
          description="Centralized authorization mapping for Phase 1 components"
          breadcrumbs={[{ label: 'Admin' }, { label: 'Permission Matrix' }]}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#0F4C81]" />
              <span>Module Access Security Matrix</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={MATRIX_DATA}
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
