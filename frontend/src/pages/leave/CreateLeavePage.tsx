import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { employeeService } from '../../services/employeeService';
import { leaveService } from '../../services/leaveService';
import type { Employee, LeaveType } from '../../types';

export const CreateLeavePage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'CASUAL' as LeaveType,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: '',
  });

  useEffect(() => {
    employeeService.getEmployees().then((res) => {
      if (res.success && res.data.length > 0) {
        setEmployees(res.data);
        setFormData((prev) => ({ ...prev, employeeId: res.data[0].employeeId }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      setErrorMsg('Please specify the reason for leave.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const selectedEmp = employees.find((e) => e.employeeId === formData.employeeId);
    if (!selectedEmp) return;

    // Days calculation
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const res = await leaveService.createLeaveRequest({
      employeeId: selectedEmp.employeeId,
      employeeName: selectedEmp.name,
      department: selectedEmp.department,
      leaveType: formData.leaveType,
      startDate: formData.startDate,
      endDate: formData.endDate,
      totalDays,
      reason: formData.reason,
    });

    setIsSubmitting(false);

    if (res.success) {
      navigate('/leave');
    } else {
      setErrorMsg(res.message || 'Failed to submit leave application');
    }
  };

  return (
    <div>
      <PageHeader
        title="Apply for Leave"
        description="File an official leave request for plant employees."
        breadcrumbs={[
          { label: 'Leave Requests', href: '/leave' },
          { label: 'Apply Leave' },
        ]}
        action={
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/leave')}
          >
            Cancel
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-status-danger text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Select Employee"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              options={employees.map((e) => ({
                value: e.employeeId,
                label: `${e.name} (${e.employeeId} - ${e.department})`,
              }))}
            />

            <Select
              label="Leave Type"
              value={formData.leaveType}
              onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as LeaveType })}
              options={[
                { value: 'CASUAL', label: 'Casual Leave' },
                { value: 'SICK', label: 'Sick Leave' },
                { value: 'PAID', label: 'Earned / Paid Leave' },
                { value: 'UNPAID', label: 'Unpaid Leave' },
              ]}
            />

            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />

            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Reason for Leave
            </label>
            <textarea
              rows={4}
              placeholder="State clear medical, personal, or administrative reasons..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              required
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => navigate('/leave')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              Submit Leave Request
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
