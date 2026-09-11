import React, { useState, useEffect } from 'react';
import { Plus, Search, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { overtimeService } from '../../services/overtimeService';
import { employeeService } from '../../services/employeeService';
import type { Overtime, Employee, OvertimeStatus } from '../../types';

export const OvertimeListPage: React.FC = () => {
  const [logs, setLogs] = useState<Overtime[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hours: 2,
    rateMultiplier: 1.5,
    notes: '',
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    const res = await overtimeService.getOvertimeLogs({ status: statusFilter, search });
    if (res.success) setLogs(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    employeeService.getEmployees().then((res) => {
      if (res.success && res.data.length > 0) {
        setEmployees(res.data);
        setFormData((prev) => ({ ...prev, employeeId: res.data[0].employeeId }));
      }
    });
  }, [statusFilter, search]);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === formData.employeeId);
    if (!emp) return;

    await overtimeService.logOvertime({
      employeeId: emp.employeeId,
      employeeName: emp.name,
      department: emp.department,
      date: formData.date,
      hours: Number(formData.hours),
      rateMultiplier: Number(formData.rateMultiplier),
      notes: formData.notes,
    });

    setIsModalOpen(false);
    fetchLogs();
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await overtimeService.updateOvertimeStatus(id, status);
    fetchLogs();
  };

  const totalOvertimeHours = logs.reduce((sum, l) => sum + (l.status === 'APPROVED' ? l.hours : 0), 0);
  const totalPayrollAccrued = logs.reduce((sum, l) => sum + (l.status === 'APPROVED' ? l.payrollAmount : 0), 0);

  const columns = [
    {
      header: 'Employee',
      cell: (o: Overtime) => (
        <div>
          <p className="font-semibold text-text-primary">{o.employeeName}</p>
          <p className="text-[11px] text-text-secondary">{o.employeeId} • {o.department}</p>
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'date' as keyof Overtime,
    },
    {
      header: 'OT Hours',
      cell: (o: Overtime) => <span className="font-bold text-primary">{o.hours} hrs</span>,
    },
    {
      header: 'Rate Multiplier',
      cell: (o: Overtime) => <Badge variant="secondary">{o.rateMultiplier}x</Badge>,
    },
    {
      header: 'Payroll Amount (₹)',
      cell: (o: Overtime) => (
        <span className="font-semibold text-text-primary">₹{o.payrollAmount.toLocaleString()}</span>
      ),
    },
    {
      header: 'Status',
      cell: (o: Overtime) => {
        const variantMap: Record<OvertimeStatus, 'warning' | 'success' | 'danger'> = {
          PENDING: 'warning',
          APPROVED: 'success',
          REJECTED: 'danger',
        };
        return <Badge variant={variantMap[o.status]}>{o.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (o: Overtime) => (
        <div className="flex items-center gap-1">
          {o.status === 'PENDING' ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(o.id, 'APPROVED')}
                title="Approve OT"
                icon={<CheckCircle className="w-4 h-4 text-status-success" />}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpdateStatus(o.id, 'REJECTED')}
                title="Reject OT"
                icon={<XCircle className="w-4 h-4 text-status-danger" />}
              />
            </>
          ) : (
            <span className="text-[11px] text-text-muted italic">Reviewed</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Overtime Management"
        description="Log overtime hours worked by plant personnel and track payroll impacts."
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Log Overtime
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Approved Overtime Hours</p>
            <h4 className="text-2xl font-bold text-text-primary">{totalOvertimeHours} Hours</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg text-status-success">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total Overtime Payable</p>
            <h4 className="text-2xl font-bold text-text-primary">₹{totalPayrollAccrued.toLocaleString()}</h4>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-72">
            <Input
              placeholder="Search employee, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        data={logs}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyText="No overtime logs recorded."
      />

      {/* Log Overtime Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Overtime Hours"
        subtitle="Record additional operational hours worked by plant employee"
      >
        <form onSubmit={handleCreateLog} className="space-y-4">
          <Select
            label="Select Employee"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            options={employees.map((e) => ({
              value: e.employeeId,
              label: `${e.name} (${e.employeeId} - ${e.department})`,
            }))}
          />

          <Input
            label="Date Worked"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Overtime Hours"
              type="number"
              step="0.5"
              value={formData.hours}
              onChange={(e) => setFormData({ ...formData, hours: Number(e.target.value) })}
              required
            />

            <Select
              label="Multiplier Rate"
              value={formData.rateMultiplier.toString()}
              onChange={(e) => setFormData({ ...formData, rateMultiplier: Number(e.target.value) })}
              options={[
                { value: '1.5', label: '1.5x (Standard Overtime)' },
                { value: '2.0', label: '2.0x (Holiday / Night Shift)' },
              ]}
            />
          </div>

          <Input
            label="Reason / Work Notes"
            placeholder="e.g. Bottling target push for distributor order"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Log Overtime Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
