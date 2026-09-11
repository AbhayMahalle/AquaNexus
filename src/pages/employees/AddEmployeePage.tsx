import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { employeeService } from '../../services/employeeService';
import type { EmployeeStatus } from '../../types';

export const AddEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    employeeId: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    department: 'Production',
    designation: 'Plant Operator',
    contactNumber: '',
    email: '',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'ACTIVE' as EmployeeStatus,
    salary: 25000,
    address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('Please enter the employee full name.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const res = await employeeService.createEmployee(formData);
    setIsSubmitting(false);

    if (res.success) {
      navigate('/employees');
    } else {
      setErrorMsg(res.message || 'Failed to add employee');
    }
  };

  return (
    <div>
      <PageHeader
        title="Add New Employee"
        description="Register a new plant staff member into the internal management system."
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: 'Add Employee' },
        ]}
        action={
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/employees')}
          >
            Back to List
          </Button>
        }
      />

      <Card className="max-w-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-status-danger text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              required
              helperText="Auto-generated unique internal ID"
            />

            <Input
              label="Full Name"
              placeholder="e.g. Rajesh Kumar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Select
              label="Department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={[
                { value: 'Production', label: 'Production' },
                { value: 'Quality Assurance', label: 'Quality Assurance' },
                { value: 'Store', label: 'Store & Warehouse' },
                { value: 'Maintenance', label: 'Maintenance' },
                { value: 'Administration', label: 'Administration' },
              ]}
            />

            <Input
              label="Designation"
              placeholder="e.g. Plant Operator"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
            />

            <Input
              label="Contact Number"
              placeholder="+91 98765 43210"
              value={formData.contactNumber}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="employee@waterplant.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Joining Date"
              type="date"
              value={formData.joiningDate}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              required
            />

            <Select
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
              options={[
                { value: 'ACTIVE', label: 'Active' },
                { value: 'ON_LEAVE', label: 'On Leave' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />

            <Input
              label="Monthly Base Salary (₹)"
              type="number"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Residential Address"
            placeholder="Street address, city..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/employees')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              Save Employee Record
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
