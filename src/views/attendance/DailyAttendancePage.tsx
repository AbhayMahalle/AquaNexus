'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Save, CheckCircle2, Clock, UserX, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import type { Attendance, AttendanceStatus } from '../../types';

interface DailyAttendancePageProps {
  allowedStatuses?: AttendanceStatus[];
}

export const DailyAttendancePage: React.FC<DailyAttendancePageProps> = ({ allowedStatuses }) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [department, setDepartment] = useState('ALL');
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const loadAttendance = useCallback(async () => {
    setIsLoading(true);
    const [attRes, empRes] = await Promise.all([
      attendanceService.getDailyAttendance(selectedDate, { department, search }),
      employeeService.getEmployees({ department, search })
    ]);

    if (empRes.success && attRes.success) {
      const attendanceData = attRes.data;
      const employeesData = empRes.data;
      
      const mergedRecords: Attendance[] = employeesData.map(emp => {
        const existingAtt = attendanceData.find(a => a.employeeId === emp.employeeId);
        if (existingAtt) return existingAtt;
        
        return {
          id: `new-${emp.id}`,
          employeeId: emp.employeeId,
          employeeName: emp.name,
          department: emp.department,
          date: selectedDate,
          status: '' as AttendanceStatus,
          checkIn: '',
          checkOut: '',
          overtimeHours: 0,
          remarks: ''
        };
      });
      setRecords(mergedRecords);
    } else if (attRes.success) {
      setRecords(attRes.data);
    }
    
    setIsLoading(false);
  }, [department, search, selectedDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleStatusChange = (id: string, newStatus: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const isPresent = newStatus === 'PRESENT' || newStatus === 'LATE' || newStatus === 'HALF_DAY';
          return {
            ...r,
            status: newStatus,
            checkIn: isPresent ? r.checkIn || '08:00 AM' : '',
            checkOut: isPresent ? r.checkOut || '05:00 PM' : '',
          };
        }
        return r;
      })
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccessMsg('');
    for (const rec of records) {
      if (rec.status) {
        await attendanceService.markAttendance(rec);
      }
    }
    setIsSaving(false);
    setSaveSuccessMsg(`Daily attendance saved for ${selectedDate}`);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const lateCount = records.filter((r) => r.status === 'LATE').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;

  const columns = [
    {
      header: 'Employee',
      accessorKey: 'employeeName' as keyof Attendance,
      cell: (r: Attendance) => (
        <div>
          <p className="font-semibold text-text-primary">{r.employeeName}</p>
          <p className="text-[11px] text-text-secondary">{r.employeeId} • {r.department}</p>
        </div>
      ),
    },
    {
      header: 'Attendance Status',
      accessorKey: 'status' as keyof Attendance,
      cell: (r: Attendance) => (
        <div className="w-36">
          <Select
            value={r.status}
            onChange={(e) => handleStatusChange(r.id, e.target.value as AttendanceStatus)}
            options={
              allowedStatuses
                ? [
                    { value: '', label: 'Select Status...' },
                    ...allowedStatuses.map(status => ({
                      value: status,
                      label: status.charAt(0) + status.slice(1).toLowerCase(),
                    }))
                  ]
                : [
                    { value: '', label: 'Select Status...' },
                    { value: 'PRESENT', label: 'Present' },
                    { value: 'LATE', label: 'Late Arrival' },
                    { value: 'HALF_DAY', label: 'Half Day' },
                    { value: 'ABSENT', label: 'Absent' },
                    { value: 'ON_LEAVE', label: 'On Leave' },
                  ]
            }
          />
        </div>
      ),
    },
    {
      header: 'Check In',
      cell: (r: Attendance) => (
        <span className="text-xs font-mono text-text-primary">{r.checkIn || '--:--'}</span>
      ),
    },
    {
      header: 'Check Out',
      cell: (r: Attendance) => (
        <span className="text-xs font-mono text-text-primary">{r.checkOut || '--:--'}</span>
      ),
    },
    {
      header: 'OT Hours',
      cell: (r: Attendance) => (
        <span className="text-xs font-semibold text-primary">{r.overtimeHours ? `${r.overtimeHours} hrs` : '0'}</span>
      ),
    },
    {
      header: 'Remarks',
      cell: (r: Attendance) => (
        <input
          type="text"
          placeholder="Add note..."
          value={r.remarks || ''}
          onChange={(e) => {
            const val = e.target.value;
            setRecords((prev) => prev.map((item) => (item.id === r.id ? { ...item, remarks: val } : item)));
          }}
          className="w-full text-xs px-2 py-1 bg-slate-50 border border-border rounded focus:outline-none focus:border-secondary"
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Daily Attendance Logger"
        description="Maintain daily shift attendance for water plant personnel."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={<UserPlus className="w-4 h-4" />}
              onClick={() => router.push('/employees/add')}
            >
              Add Employee
            </Button>
            <Button
              variant="primary"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
              onClick={handleSaveAll}
            >
              Save Attendance Log
            </Button>
          </div>
        }
      />

      {saveSuccessMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-status-success rounded-md text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {saveSuccessMsg}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg text-status-success">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Present Today</p>
            <h4 className="text-2xl font-bold text-text-primary">{presentCount}</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg text-status-warning">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Late Arrivals</p>
            <h4 className="text-2xl font-bold text-text-primary">{lateCount}</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-lg text-status-danger">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Absent / Unexcused</p>
            <h4 className="text-2xl font-bold text-text-primary">{absentCount}</h4>
          </div>
        </Card>
      </div>

      {/* Controls Bar */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-44">
              <Input
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Departments' },
                  { value: 'Production', label: 'Production' },
                  { value: 'Quality Assurance', label: 'Quality Assurance' },
                  { value: 'Store', label: 'Store & Warehouse' },
                  { value: 'Maintenance', label: 'Maintenance' },
                  { value: 'Administration', label: 'Administration' },
                ]}
              />
            </div>
          </div>

          <div className="w-full md:w-64 pt-5 md:pt-0">
            <Input
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        data={records}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyText="No attendance entries recorded for selected date."
      />
    </div>
  );
};

export default DailyAttendancePage;
