import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarCheck } from 'lucide-react';

interface AttendanceRow {
  id: string;
  name: string;
  role: string;
  shift: string;
  checkIn: string;
  status: 'present' | 'absent' | 'late' | 'leave';
}

const MOCK_ATTENDANCE: AttendanceRow[] = [
  { id: '1', name: 'Ramesh K.', role: 'Line Operator', shift: 'Morning (06 AM - 02 PM)', checkIn: '05:55 AM', status: 'present' },
  { id: '2', name: 'Sunil P.', role: 'Filling Line Tech', shift: 'Morning (06 AM - 02 PM)', checkIn: '06:12 AM', status: 'late' },
  { id: '3', name: 'Amit S.', role: 'Quality Analyst', shift: 'Morning (06 AM - 02 PM)', checkIn: '05:50 AM', status: 'present' },
  { id: '4', name: 'Vikas M.', role: 'Loader Operator', shift: 'Evening (02 PM - 10 PM)', checkIn: '-', status: 'leave' },
];

export default function AttendancePage() {
  const columns: Column<AttendanceRow>[] = [
    { key: 'name', header: 'Staff Name', render: (r) => <span className="font-bold text-[#172033]">{r.name}</span> },
    { key: 'role', header: 'Designation' },
    { key: 'shift', header: 'Assigned Shift' },
    { key: 'checkIn', header: 'Check In Time' },
    { 
      key: 'status', 
      header: 'Status', 
      render: (r) => {
        const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
          present: 'success',
          absent: 'danger',
          late: 'warning',
          leave: 'info',
        };
        return <Badge variant={map[r.status]}>{r.status.toUpperCase()}</Badge>;
      }
    },
  ];

  return (
    <AuthGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <PageHeader
          title="Attendance & HR Shift Log (NIRANJAN)"
          description="Track worker check-in times, shift allocations, and leave entries"
          breadcrumbs={[{ label: 'Manager' }, { label: 'Attendance' }]}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#0F4C81]" />
              <span>Shift Attendance Register</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table columns={columns} data={MOCK_ATTENDANCE} />
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
