import React, { useState, useMemo } from 'react';
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
import { showToast, exportToCSV } from '@/lib/api';
import { CalendarCheck, Search, Plus, Download, Filter, X, Clock, Users } from 'lucide-react';

interface AttendanceRow {
  id: string;
  name: string;
  role: string;
  shift: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'leave';
  date: string;
}

const MOCK_ATTENDANCE: AttendanceRow[] = [
  { id: '1', name: 'Ramesh K.', role: 'Line Operator', shift: 'Morning (06 AM - 02 PM)', checkIn: '05:55 AM', checkOut: '02:05 PM', status: 'present', date: '2026-09-09' },
  { id: '2', name: 'Sunil P.', role: 'Filling Line Tech', shift: 'Morning (06 AM - 02 PM)', checkIn: '06:12 AM', checkOut: '02:10 PM', status: 'late', date: '2026-09-09' },
  { id: '3', name: 'Amit S.', role: 'Quality Analyst', shift: 'Morning (06 AM - 02 PM)', checkIn: '05:50 AM', checkOut: '02:00 PM', status: 'present', date: '2026-09-09' },
  { id: '4', name: 'Vikas M.', role: 'Loader Operator', shift: 'Evening (02 PM - 10 PM)', checkIn: '-', checkOut: '-', status: 'leave', date: '2026-09-09' },
  { id: '5', name: 'Prashant G.', role: 'Packaging Lead', shift: 'Morning (06 AM - 02 PM)', checkIn: '05:48 AM', checkOut: '02:15 PM', status: 'present', date: '2026-09-09' },
  { id: '6', name: 'Anita K.', role: 'Lab Technician', shift: 'Morning (06 AM - 02 PM)', checkIn: '-', checkOut: '-', status: 'absent', date: '2026-09-09' },
  { id: '7', name: 'Deepak R.', role: 'Machine Operator', shift: 'Evening (02 PM - 10 PM)', checkIn: '01:55 PM', checkOut: '-', status: 'present', date: '2026-09-09' },
  { id: '8', name: 'Kavita S.', role: 'Store Assistant', shift: 'Morning (06 AM - 02 PM)', checkIn: '06:20 AM', checkOut: '02:00 PM', status: 'late', date: '2026-09-09' },
];

const ITEMS_PER_PAGE = 5;

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRow[]>(MOCK_ATTENDANCE);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [shiftFilter, setShiftFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newEntry, setNewEntry] = useState({ name: '', role: '', shift: 'Morning (06 AM - 02 PM)', checkIn: '', status: 'present' as const });

  const filtered = useMemo(() => {
    let data = attendance;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r => r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q));
    }
    if (statusFilter) data = data.filter(r => r.status === statusFilter);
    if (shiftFilter) data = data.filter(r => r.shift.includes(shiftFilter));
    return data;
  }, [attendance, search, statusFilter, shiftFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const clearFilters = () => { setSearch(''); setStatusFilter(''); setShiftFilter(''); setCurrentPage(1); };
  const hasFilters = search || statusFilter || shiftFilter;

  // Summary stats
  const stats = useMemo(() => ({
    present: attendance.filter(a => a.status === 'present').length,
    late: attendance.filter(a => a.status === 'late').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    leave: attendance.filter(a => a.status === 'leave').length,
    total: attendance.length,
  }), [attendance]);

  const handleAdd = async () => {
    if (!newEntry.name.trim()) { showToast('Enter employee name', 'warning'); return; }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));
    const entry: AttendanceRow = {
      id: `att_${Date.now()}`,
      name: newEntry.name,
      role: newEntry.role || 'Staff',
      shift: newEntry.shift,
      checkIn: newEntry.checkIn || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      checkOut: '-',
      status: newEntry.status,
      date: new Date().toISOString().slice(0, 10),
    };
    setAttendance(prev => [entry, ...prev]);
    setIsAddOpen(false);
    setNewEntry({ name: '', role: '', shift: 'Morning (06 AM - 02 PM)', checkIn: '', status: 'present' });
    setIsSaving(false);
    showToast(`Attendance logged for ${entry.name}`, 'success');
  };

  const handleExport = () => {
    exportToCSV(filtered, [
      { key: 'name', header: 'Name' },
      { key: 'role', header: 'Designation' },
      { key: 'shift', header: 'Shift' },
      { key: 'checkIn', header: 'Check In' },
      { key: 'checkOut', header: 'Check Out' },
      { key: 'status', header: 'Status' },
      { key: 'date', header: 'Date' },
    ], 'attendance_report');
  };

  const columns: Column<AttendanceRow>[] = [
    { key: 'name', header: 'Staff Name', render: (r) => <span className="font-bold text-[#172033]">{r.name}</span> },
    { key: 'role', header: 'Designation' },
    { key: 'shift', header: 'Assigned Shift' },
    { key: 'checkIn', header: 'Check In' },
    { key: 'checkOut', header: 'Check Out' },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
          present: 'success', absent: 'danger', late: 'warning', leave: 'info',
        };
        return <Badge variant={map[r.status]}>{r.status.toUpperCase()}</Badge>;
      }
    },
  ];

  return (
    <AuthGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <PageHeader
          title="Attendance & HR Shift Log"
          description="Track worker check-in times, shift allocations, and leave entries"
          breadcrumbs={[{ label: 'Manager' }, { label: 'Attendance' }]}
          primaryAction={{
            label: 'Log Attendance',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setIsAddOpen(true),
          }}
          secondaryActions={[{
            label: 'Export',
            icon: <Download className="w-4 h-4" />,
            variant: 'outline',
            onClick: handleExport,
          }]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <p className="text-xs text-[#64748B] font-semibold">Total Staff</p>
            <p className="text-xl font-bold text-[#172033]">{stats.total}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#16A34A]/20">
            <p className="text-xs text-[#16A34A] font-semibold">Present</p>
            <p className="text-xl font-bold text-[#16A34A]">{stats.present}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/20">
            <p className="text-xs text-[#D97706] font-semibold">Late</p>
            <p className="text-xl font-bold text-[#D97706]">{stats.late}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#DC2626]/20">
            <p className="text-xs text-[#DC2626] font-semibold">Absent</p>
            <p className="text-xl font-bold text-[#DC2626]">{stats.absent}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/20">
            <p className="text-xs text-[#2563EB] font-semibold">On Leave</p>
            <p className="text-xl font-bold text-[#2563EB]">{stats.leave}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-[#0F4C81]" />
              <span>Shift Attendance Register</span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input placeholder="Search name or role..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />} className="sm:!w-48" />
              <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                options={[{ label: 'All Status', value: '' }, { label: 'Present', value: 'present' }, { label: 'Late', value: 'late' }, { label: 'Absent', value: 'absent' }, { label: 'On Leave', value: 'leave' }]}
                className="!w-32"
              />
              <Select value={shiftFilter} onChange={(e) => { setShiftFilter(e.target.value); setCurrentPage(1); }}
                options={[{ label: 'All Shifts', value: '' }, { label: 'Morning', value: 'Morning' }, { label: 'Evening', value: 'Evening' }]}
                className="!w-32"
              />
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="w-3.5 h-3.5" />}>Clear</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table columns={columns} data={paginated} emptyText="No attendance records found" />
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
          </CardContent>
        </Card>

        {/* Add Entry Modal */}
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Log Attendance Entry" description="Record a check-in for a plant worker"
          footer={
            <>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleAdd} loading={isSaving}>Log Entry</Button>
            </>
          }
        >
          <div className="space-y-4">
            <Input label="Employee Name" required value={newEntry.name} onChange={(e) => setNewEntry(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Ramesh K." />
            <Input label="Designation" value={newEntry.role} onChange={(e) => setNewEntry(p => ({ ...p, role: e.target.value }))} placeholder="e.g. Line Operator" />
            <Select label="Shift" value={newEntry.shift} onChange={(e) => setNewEntry(p => ({ ...p, shift: e.target.value }))}
              options={[{ label: 'Morning (06 AM - 02 PM)', value: 'Morning (06 AM - 02 PM)' }, { label: 'Evening (02 PM - 10 PM)', value: 'Evening (02 PM - 10 PM)' }, { label: 'Night (10 PM - 06 AM)', value: 'Night (10 PM - 06 AM)' }]}
            />
            <Input label="Check-in Time" placeholder="e.g. 05:55 AM (leave blank for now)" value={newEntry.checkIn} onChange={(e) => setNewEntry(p => ({ ...p, checkIn: e.target.value }))} />
            <Select label="Status" value={newEntry.status} onChange={(e) => setNewEntry(p => ({ ...p, status: e.target.value as any }))}
              options={[{ label: 'Present', value: 'present' }, { label: 'Late', value: 'late' }, { label: 'Absent', value: 'absent' }, { label: 'On Leave', value: 'leave' }]}
            />
          </div>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
