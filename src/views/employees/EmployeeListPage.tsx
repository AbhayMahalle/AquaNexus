'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { showToast } from '../../lib/api';

export const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isManager = location.pathname.startsWith('/manager');
  const isAdmin = location.pathname.startsWith('/admin');
  const baseRoute = isManager ? '/manager/employees' : (isAdmin ? '/admin/employees' : '/employees');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [status, setStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    employeeService.getDepartments().then((res) => {
      if (mounted && res.success && res.data) {
        setDepartments(res.data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    const res = await employeeService.getEmployees({ search, department, status });
    if (res.success) {
      setEmployees(res.data);
    }
    setIsLoading(false);
  }, [department, search, status]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleToggleStatus = async (emp: Employee) => {
    if (togglingId) return;
    const newStatus = emp.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setTogglingId(emp.id);

    // Optimistic UI update
    setEmployees((prev) =>
      prev.map((item) => (item.id === emp.id ? { ...item, status: newStatus } : item))
    );

    try {
      const res = await employeeService.updateEmployee(emp.id, { status: newStatus });
      if (res.success) {
        showToast(
          `${emp.name} marked as ${newStatus === 'ACTIVE' ? 'Active' : 'Inactive'}`,
          newStatus === 'ACTIVE' ? 'success' : 'warning'
        );
      } else {
        // Revert on failure
        setEmployees((prev) =>
          prev.map((item) => (item.id === emp.id ? { ...item, status: emp.status } : item))
        );
        showToast(res.message || 'Failed to update employee status', 'error');
      }
    } catch (err: any) {
      // Revert on failure
      setEmployees((prev) =>
        prev.map((item) => (item.id === emp.id ? { ...item, status: emp.status } : item))
      );
      showToast(err.message || 'Failed to update employee status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

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
        const isActive = e.status === 'ACTIVE';
        const isToggling = togglingId === e.id;
        const variantMap: Record<string, 'success' | 'warning' | 'neutral'> = {
          ACTIVE: 'success',
          ON_LEAVE: 'warning',
          INACTIVE: 'neutral',
        };

        return (
          <div className="flex items-center gap-3">
            {/* Slider Switch Button */}
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              aria-label={`Mark ${e.name} as ${isActive ? 'Inactive' : 'Active'}`}
              disabled={isToggling}
              onClick={(ev) => {
                ev.stopPropagation();
                handleToggleStatus(e);
              }}
              title={`Click to mark as ${isActive ? 'Inactive' : 'Active'}`}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 select-none ${
                isActive ? 'bg-emerald-500' : 'bg-gray-300 hover:bg-gray-400'
              } ${isToggling ? 'opacity-60 cursor-wait' : 'hover:opacity-90'}`}
            >
              <span className="sr-only">
                {isActive ? 'Active status, click to deactivate' : 'Inactive status, click to activate'}
              </span>
              <span
                className={`pointer-events-none inline-flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                  isActive ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {isToggling ? (
                  <span className="w-2.5 h-2.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                      isActive ? 'bg-emerald-500' : 'bg-gray-400'
                    }`}
                  />
                )}
              </span>
            </button>

            {/* Status Badge */}
            <Badge variant={variantMap[e.status] || 'neutral'}>
              {e.status.replace('_', ' ')}
            </Badge>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      cell: (e: Employee) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`${baseRoute}/${e.id}`)}
            title="View Details"
            icon={<Eye className="w-3.5 h-3.5 text-secondary" />}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`${baseRoute}/${e.id}/edit`)}
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
        title="Employees"
        description="View and manage plant personnel, roles, and status."
        breadcrumbs={[{ label: 'Employees' }]}
        primaryAction={{
          label: 'Add Employee',
          icon: <Plus className="w-4 h-4" />,
          onClick: () => navigate(`${baseRoute}/add`),
          variant: 'primary',
        }}
      />

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="flex items-center gap-3.5 p-4">
          <div className="p-2.5 bg-orange-50 text-orange-600 border border-orange-200 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Staff</p>
            <h4 className="text-2xl font-bold text-black mt-0.5">{totalEmployees}</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4">
          <div className="p-2.5 bg-green-50 text-green-600 border border-green-200 rounded-lg">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Staff</p>
            <h4 className="text-2xl font-bold text-black mt-0.5">{activeEmployees}</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-3.5 p-4">
          <div className="p-2.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-lg">
            <UserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">On Leave</p>
            <h4 className="text-2xl font-bold text-black mt-0.5">{onLeaveEmployees}</h4>
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
            <div className="w-56">
              <Select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={[
                  { value: 'ALL', label: 'All Departments' },
                  ...(departments.length > 0
                    ? departments.map((d) => ({ value: d.name, label: d.name }))
                    : [
                        { value: 'General Management', label: 'General Management' },
                        { value: 'Production', label: 'Production' },
                        { value: 'Store & Inventory', label: 'Store & Inventory' },
                        { value: 'Distribution', label: 'Distribution' },
                        { value: 'Finance & Accounts', label: 'Finance & Accounts' },
                      ])
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
        subtitle="This action will permanently delete the employee record and linked credentials from the database."
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
            <p className="font-semibold">Are you sure you want to permanently delete {deleteTarget?.name}?</p>
            <p className="mt-0.5 text-text-secondary">
              ID: {deleteTarget?.employeeId} • Dept: {deleteTarget?.department}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EmployeeListPage;
