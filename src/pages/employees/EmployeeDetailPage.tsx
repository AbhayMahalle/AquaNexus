import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Mail, Phone, Calendar, MapPin, IndianRupee, Briefcase, Award } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Skeleton } from '../../components/ui/Skeleton';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../types';

export const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      employeeService.getEmployeeById(id).then((res) => {
        if (res.success) setEmployee(res.data);
        setIsLoading(false);
      });
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary text-sm">Employee not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/employees')}>
          Back to Employee List
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={employee.name}
        description={`ID: ${employee.employeeId} • ${employee.designation} (${employee.department})`}
        breadcrumbs={[
          { label: 'Employees', href: '/employees' },
          { label: employee.name },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ArrowLeft className="w-4 h-4" />}
              onClick={() => navigate('/employees')}
            >
              Back
            </Button>
            <Button
              variant="primary"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              Edit Profile
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Card: Core Profile Info */}
        <Card className="md:col-span-1">
          <div className="flex flex-col items-center text-center pb-6 border-b border-border">
            <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center mb-3">
              {employee.name.charAt(0)}
            </div>
            <h3 className="text-lg font-bold text-text-primary">{employee.name}</h3>
            <p className="text-xs text-text-secondary font-medium">{employee.designation}</p>
            <div className="mt-3">
              <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'warning'}>
                {employee.status}
              </Badge>
            </div>
          </div>

          <div className="pt-6 space-y-4 text-xs">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-text-muted">Email</p>
                <p className="font-semibold text-text-primary">{employee.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-text-muted">Contact</p>
                <p className="font-semibold text-text-primary">{employee.contactNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-text-muted">Department</p>
                <p className="font-semibold text-text-primary">{employee.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" />
              <div>
                <p className="text-text-muted">Joining Date</p>
                <p className="font-semibold text-text-primary">{employee.joiningDate}</p>
              </div>
            </div>

            {employee.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-text-muted shrink-0" />
                <div>
                  <p className="text-text-muted">Address</p>
                  <p className="font-semibold text-text-primary">{employee.address}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Right Cards: Attendance Summary & Compensation */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Compensation & Payroll Metrics">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-border rounded-md">
                <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                  <IndianRupee className="w-4 h-4 text-secondary" /> Base Salary
                </div>
                <h4 className="text-xl font-bold text-text-primary">
                  ₹{employee.salary.toLocaleString()} / mo
                </h4>
              </div>

              <div className="p-4 bg-slate-50 border border-border rounded-md">
                <div className="flex items-center gap-2 text-text-secondary text-xs mb-1">
                  <Award className="w-4 h-4 text-status-success" /> Attendance Record
                </div>
                <h4 className="text-xl font-bold text-text-primary">96.4% Attendance</h4>
              </div>
            </div>
          </Card>

          <Card title="Quick Action Shortcuts">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="sm" onClick={() => navigate('/attendance')}>
                View Daily Attendance
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/leave')}>
                Check Leave Requests
              </Button>
              <Button variant="secondary" size="sm" onClick={() => navigate('/overtime')}>
                Log Overtime Hours
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
