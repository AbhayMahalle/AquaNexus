import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { employeeService } from '../../services/employeeService';
import type { Employee, EmployeeStatus } from '../../types';

export const EditEmployeePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    if (id) {
      employeeService.getEmployeeById(id).then((res) => {
        if (res.success && res.data) {
          setFormData(res.data);
        }
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.name) return;
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await employeeService.updateEmployee(id, formData);
    setIsSubmitting(false);

    if (res.success) {
      navigate(`/employees/${id}`);
    } else {
      setErrorMsg(res.message || 'Failed to update employee');
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${formData.name || 'Employee'}`}
        description="Update internal plant personnel details."
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: formData.name || 'Edit', href: `/employees/${id}` },
          { label: 'Edit' },
        ]}
        action={
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(`/employees/${id}`)}
          >
            Cancel
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
              value={formData.employeeId || ''}
              disabled
            />

            <Input
              label="Full Name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Select
              label="Department"
              value={formData.department || 'Production'}
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
              value={formData.designation || ''}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
            />

            <Input
              label="Contact Number"
              value={formData.contactNumber || ''}
              onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Joining Date"
              type="date"
              value={formData.joiningDate || ''}
              onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              required
            />

            <Select
              label="Status"
              value={formData.status || 'ACTIVE'}
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
              value={formData.salary || 0}
              onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Residential Address"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/employees/${id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              Update Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
