import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Edit, Trash2, Users, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/ui/Pagination';
import { employeeService } from '../../services/employeeService';
import type { Employee } from '../../types';

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  const fetchEmployees = async () => {
    setIsLoading(true);
    const res = await employeeService.getEmployees({ search, department, status });
    if (res.success) {
      setEmployees(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, department, status]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await employeeService.deleteEmployee(deleteTarget.id);
    setDeleteTarget(null);
    fetchEmployees();
  };

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE').length;
  const onLeaveEmployees = employees.filter((e) => e.status === 'ON_LEAVE').length;

  const columns = [
    {
      header: 'Employee ID',
      accessorKey: 'employeeId' as keyof Employee,
      cell: (e: Employee) => <span className="font-semibold text-primary">{e.employeeId}</span>,
    },
    {
      header: 'Full Name',
      accessorKey: 'name' as keyof Employee,
      cell: (e: Employee) => (
        <div>
          <p className="font-semibold text-text-primary">{e.name}</p>
          <p className="text-[11px] text-text-secondary">{e.email}</p>
        </div>
      ),
    },
    {
      header: 'Department',
      accessorKey: 'department' as keyof Employee,
    },
    {
      header: 'Designation',
      accessorKey: 'designation' as keyof Employee,
    },
    {
      header: 'Status',
      accessorKey: 'status' as keyof Employee,
      cell: (e: Employee) => {
        const variantMap: Record<string, 'success' | 'warning' | 'neutral'> = {
          ACTIVE: 'success',
          ON_LEAVE: 'warning',
          INACTIVE: 'neutral',
        };
        return <Badge variant={variantMap[e.status] || 'neutral'}>{e.status.replace('_', ' ')}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (e: Employee) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/employees/${e.id}`)}
            title="View Details"
            icon={<Eye className="w-3.5 h-3.5 text-secondary" />}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/employees/${e.id}/edit`)}
            title="Edit Record"
            icon={<Edit className="w-3.5 h-3.5 text-text-secondary" />}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(e)}
            title="Delete Record"
            icon={<Trash2 className="w-3.5 h-3.5 text-status-danger" />}
          />
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Management"
        description="Internal master list of water plant personnel for attendance, leave, overtime and payroll."
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/employees/add')}
          >
            Add Employee
          </Button>
        }
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total Employees</p>
            <h4 className="text-2xl font-bold text-text-primary">{totalEmployees}</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg text-status-success">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Active Staff</p>
            <h4 className="text-2xl font-bold text-text-primary">{activeEmployees}</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg text-status-warning">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">On Approved Leave</p>
            <h4 className="text-2xl font-bold text-text-primary">{onLeaveEmployees}</h4>
          </div>
        </Card>
      </div>

      {/* Search and Filters Bar */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-72">
            <Input
              placeholder="Search by name, ID, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-44">
              <Select
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
            <div className="w-36">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Status' },
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'ON_LEAVE', label: 'On Leave' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <Table
        columns={columns}
        data={employees}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyText="No employee records found matching your query."
      />

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(employees.length / 10)}
        totalItems={employees.length}
        pageSize={10}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete Employee"
        subtitle="This action will archive the employee record from active plant directories."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Record
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-md text-status-danger text-xs">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Are you sure you want to delete {deleteTarget?.name}?</p>
            <p className="mt-0.5 text-text-secondary">
              ID: {deleteTarget?.employeeId} • Dept: {deleteTarget?.department}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
