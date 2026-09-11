import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { showToast } from '@/lib/api';
import { Check, X, Lock, Save, RotateCcw } from 'lucide-react';

interface MatrixRow {
  module: string;
  admin: boolean;
  manager: boolean;
  store: boolean;
  accountant: boolean;
  distributor: boolean;
}

const INITIAL_MATRIX: MatrixRow[] = [
  { module: 'User & Role Security Management', admin: true, manager: false, store: false, accountant: false, distributor: false },
  { module: 'Production Batch Entry & Telemetry', admin: true, manager: true, store: false, accountant: false, distributor: false },
  { module: 'Store & Inventory Management', admin: true, manager: true, store: true, accountant: false, distributor: false },
  { module: 'Employee Attendance & Shift Records', admin: true, manager: true, store: false, accountant: true, distributor: false },
  { module: 'Financial Ledgers & Invoicing', admin: true, manager: false, store: false, accountant: true, distributor: false },
  { module: 'Distributor Order Dispatch', admin: true, manager: true, store: true, accountant: false, distributor: true },
  { module: 'Reports & Analytics', admin: true, manager: true, store: true, accountant: true, distributor: false },
  { module: 'Quality Lab & Testing', admin: true, manager: true, store: false, accountant: false, distributor: false },
];

type RoleKey = 'admin' | 'manager' | 'store' | 'accountant' | 'distributor';

const ROLE_HEADERS: { key: RoleKey; label: string; color: string }[] = [
  { key: 'admin', label: 'Admin', color: '#F97316' },
  { key: 'manager', label: 'Manager', color: '#EA580C' },
  { key: 'store', label: 'Store Mgr', color: '#16A34A' },
  { key: 'accountant', label: 'Accountant', color: '#2563EB' },
  { key: 'distributor', label: 'Distributor', color: '#F59E0B' },
];

export default function PermissionMatrixPage() {
  const [matrix, setMatrix] = useState<MatrixRow[]>(INITIAL_MATRIX);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleCell = (rowIdx: number, roleKey: RoleKey) => {
    // Admin always has all permissions — don't allow toggling
    if (roleKey === 'admin') {
      showToast('Admin permissions cannot be modified', 'warning');
      return;
    }
    setMatrix(prev => prev.map((row, idx) =>
      idx === rowIdx ? { ...row, [roleKey]: !row[roleKey] } : row
    ));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    setHasChanges(false);
    showToast('Permission matrix saved successfully', 'success');
  };

  const handleReset = () => {
    setMatrix(INITIAL_MATRIX);
    setHasChanges(false);
    showToast('Matrix reset to defaults', 'info');
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout>
        <PageHeader
          title="Permission Matrix"
          description="Centralized authorization mapping for all ERP modules"
          breadcrumbs={[{ label: 'Admin' }, { label: 'Permission Matrix' }]}
          primaryAction={hasChanges ? {
            label: 'Save Changes',
            icon: <Save className="w-4 h-4" />,
            onClick: handleSave,
            loading: isSaving,
          } : undefined}
          secondaryActions={hasChanges ? [{
            label: 'Reset',
            icon: <RotateCcw className="w-4 h-4" />,
            variant: 'outline',
            onClick: handleReset,
          }] : []}
        />

        {hasChanges && (
          <div className="mb-4 p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] text-xs font-medium text-[#92400E] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
            You have unsaved changes. Click "Save Changes" to apply.
          </div>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#F97316]" />
              <span>Module Access Security Matrix</span>
            </CardTitle>
            <Badge variant="primary" size="sm">Click cells to toggle</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-full">
                <thead>
                  <tr className="bg-[#F8F8F8] border-b border-[#E5E5E5]">
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#666666] min-w-[240px] whitespace-nowrap">
                      ERP Functional Module
                    </th>
                    {ROLE_HEADERS.map(rh => (
                      <th key={rh.key} className="px-3 py-3 text-center whitespace-nowrap">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: rh.color }}>{rh.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {matrix.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-[#F8F8F8] transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-sm text-[#222222]">{row.module}</span>
                      </td>
                      {ROLE_HEADERS.map(rh => {
                        const val = row[rh.key];
                        const isAdmin = rh.key === 'admin';
                        return (
                          <td key={rh.key} className="px-3 py-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => toggleCell(rowIdx, rh.key)}
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                                val
                                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#86EFAC]/40 hover:bg-[#DCFCE7]'
                                  : 'bg-[#F5F5F5] text-[#999999] border border-[#E5E5E5] hover:bg-[#E5E5E5] hover:text-[#222222]'
                              } ${isAdmin ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                              title={isAdmin ? 'Admin always has access' : `Toggle ${rh.label} access to ${row.module}`}
                            >
                              {val
                                ? <Check className="w-4 h-4" />
                                : <X className="w-4 h-4" />
                              }
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 p-4 rounded-xl bg-[#F8F8F8] border border-[#E5E5E5]">
          <p className="text-xs text-[#666666]">
            <strong className="text-[#222222]">Note:</strong> The permission matrix defines which ERP modules each role can access.
            The Admin role always has full access and cannot be restricted.
            Backend enforcement is the authoritative security layer — this matrix configures the frontend navigation and access.
          </p>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
