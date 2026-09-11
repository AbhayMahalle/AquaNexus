import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { attendanceService } from '../../services/attendanceService';

export const MonthlyAttendancePage: React.FC = () => {
  const [month, setMonth] = useState('September');
  const [year, setYear] = useState(2026);
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    attendanceService.getMonthlyAttendanceSummary(month, year).then((res) => {
      if (res.success) setSummaryData(res.data);
      setIsLoading(false);
    });
  }, [month, year]);

  const columns = [
    {
      header: 'Employee Name',
      cell: (item: any) => (
        <div>
          <p className="font-semibold text-text-primary">{item.name}</p>
          <p className="text-[11px] text-text-secondary">{item.employeeId} • {item.department}</p>
        </div>
      ),
    },
    {
      header: 'Total Working Days',
      cell: (item: any) => <span className="font-semibold">{item.totalWorkingDays}</span>,
    },
    {
      header: 'Present Days',
      cell: (item: any) => <span className="text-status-success font-semibold">{item.present}</span>,
    },
    {
      header: 'Absent Days',
      cell: (item: any) => <span className="text-status-danger font-semibold">{item.absent}</span>,
    },
    {
      header: 'Leaves Taken',
      cell: (item: any) => <span className="text-status-warning font-semibold">{item.leave}</span>,
    },
    {
      header: 'Total Overtime',
      cell: (item: any) => <Badge variant="primary">{item.overtimeHours} Hours</Badge>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Monthly Attendance Summary"
        description="Aggregate attendance calculations for monthly HR and payroll processing."
        breadcrumbs={[
          { label: 'Attendance', href: '/attendance' },
          { label: 'Monthly Report' },
        ]}
        action={
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export Monthly Summary
          </Button>
        }
      />

      {/* Month & Year Selection Bar */}
      <Card className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-44">
            <Select
              label="Select Month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              options={[
                { value: 'January', label: 'January' },
                { value: 'February', label: 'February' },
                { value: 'March', label: 'March' },
                { value: 'April', label: 'April' },
                { value: 'May', label: 'May' },
                { value: 'June', label: 'June' },
                { value: 'July', label: 'July' },
                { value: 'August', label: 'August' },
                { value: 'September', label: 'September' },
                { value: 'October', label: 'October' },
                { value: 'November', label: 'November' },
                { value: 'December', label: 'December' },
              ]}
            />
          </div>
          <div className="w-36">
            <Select
              label="Select Year"
              value={year.toString()}
              onChange={(e) => setYear(Number(e.target.value))}
              options={[
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        data={summaryData}
        keyExtractor={(item) => item.employeeId}
        isLoading={isLoading}
      />
    </div>
  );
};
