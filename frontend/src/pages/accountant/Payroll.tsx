import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { accountantService } from '@/services/accountantService';
import { PayrollRecord } from '@/types/accountant';
import { formatCurrency } from '@/lib/utils';

export const AccountantPayroll: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayroll = async () => {
    setLoading(true);
    setError(null);
    const res = await accountantService.getPayroll();
    if (res.success && res.data) {
      setPayroll(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayroll();
  }, []);

  const filteredPayroll = payroll.filter(
    (p) =>
      p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      p.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Employee Payroll Management"
        description="Audit salary calculations, overtime pay, statutory deductions, and process monthly dispatches."
      />

      <Card className="mb-6">
        <div className="max-w-md">
          <Input
            placeholder="Search employee by name, ID, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadPayroll} />
      ) : (
        <Table<PayrollRecord>
          data={filteredPayroll}
          keyExtractor={(item) => item.id}
          columns={[
            {
              header: 'Employee Name',
              cell: (row) => (
                <div>
                  <div className="font-semibold text-[#172033]">{row.employeeName}</div>
                  <div className="text-xs text-[#64748B]">{row.employeeId} • {row.designation}</div>
                </div>
              ),
            },
            { header: 'Department', accessorKey: 'department', className: 'text-xs text-[#64748B]' },
            { header: 'Period', accessorKey: 'monthYear', className: 'text-xs text-[#172033]' },
            { header: 'Base Salary', cell: (row) => formatCurrency(row.baseSalary) },
            {
              header: 'Overtime',
              cell: (row) => (
                <div>
                  <span className="font-medium text-xs text-[#172033]">{formatCurrency(row.overtimePay)}</span>
                  <span className="text-[11px] text-[#64748B] block">({row.overtimeHours} hrs)</span>
                </div>
              ),
            },
            { header: 'Deductions', cell: (row) => <span className="text-[#DC2626] font-medium">-{formatCurrency(row.deductions)}</span> },
            {
              header: 'Net Salary',
              cell: (row) => <span className="font-bold text-sm text-[#0F4C81]">{formatCurrency(row.netSalary)}</span>,
            },
            { header: 'Status', cell: (row) => <Badge status={row.paymentStatus} /> },
            {
              header: 'Action',
              cell: (row) => (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={row.paymentStatus === 'PAID'}
                  onClick={() => alert(`Processing salary payout for ${row.employeeName}`)}
                >
                  {row.paymentStatus === 'PAID' ? 'Paid' : 'Process Payout'}
                </Button>
              ),
            },
          ]}
        />
      )}
    </DashboardLayout>
  );
};
