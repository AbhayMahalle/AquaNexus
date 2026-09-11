import type { Employee, ApiResponse } from '../types';
import { fetchApi } from './apiClient';

// Initial realistic seed dataset for plant operations
const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    employeeId: 'EMP-1001',
    name: 'Suresh Kumar',
    department: 'Production',
    designation: 'Plant Operator',
    contactNumber: '+91 98765 43210',
    email: 'suresh.k@waterplant.com',
    joiningDate: '2023-01-15',
    status: 'ACTIVE',
    salary: 28000,
    address: 'Sector 4, Industrial Area, Pune',
  },
  {
    id: 'emp-2',
    employeeId: 'EMP-1002',
    name: 'Anjali Sharma',
    department: 'Quality Assurance',
    designation: 'Lab Technician',
    contactNumber: '+91 98765 43211',
    email: 'anjali.s@waterplant.com',
    joiningDate: '2023-03-20',
    status: 'ACTIVE',
    salary: 32000,
    address: 'Kothrud, Pune',
  },
  {
    id: 'emp-3',
    employeeId: 'EMP-1003',
    name: 'Ramesh Pawar',
    department: 'Store',
    designation: 'Inventory Assistant',
    contactNumber: '+91 98765 43212',
    email: 'ramesh.p@waterplant.com',
    joiningDate: '2023-06-10',
    status: 'ACTIVE',
    salary: 24000,
    address: 'Hadapsar, Pune',
  },
  {
    id: 'emp-4',
    employeeId: 'EMP-1004',
    name: 'Vikram Jadhav',
    department: 'Maintenance',
    designation: 'Pumping Technician',
    contactNumber: '+91 98765 43213',
    email: 'vikram.j@waterplant.com',
    joiningDate: '2022-11-01',
    status: 'ON_LEAVE',
    salary: 30000,
    address: 'Chinchwad, Pune',
  },
  {
    id: 'emp-5',
    employeeId: 'EMP-1005',
    name: 'Pooja Deshmukh',
    department: 'Administration',
    designation: 'HR Executive',
    contactNumber: '+91 98765 43214',
    email: 'pooja.d@waterplant.com',
    joiningDate: '2022-08-15',
    status: 'ACTIVE',
    salary: 35000,
    address: 'Viman Nagar, Pune',
  },
];

let localEmployees: Employee[] = [...MOCK_EMPLOYEES];

export const employeeService = {
  async getEmployees(params?: { search?: string; department?: string; status?: string }): Promise<ApiResponse<Employee[]>> {
    // Try real API first
    const realResponse = await fetchApi<Employee[]>('/employees');
    if (realResponse.success && Array.isArray(realResponse.data)) {
      return realResponse;
    }

    // Fallback to local state
    let result = [...localEmployees];
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q)
      );
    }
    if (params?.department && params.department !== 'ALL') {
      result = result.filter((e) => e.department === params.department);
    }
    if (params?.status && params.status !== 'ALL') {
      result = result.filter((e) => e.status === params.status);
    }

    return {
      success: true,
      data: result,
      message: 'Employees fetched successfully',
      pagination: {
        total: result.length,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    };
  },

  async getEmployeeById(id: string): Promise<ApiResponse<Employee>> {
    const realResponse = await fetchApi<Employee>(`/employees/${id}`);
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const emp = localEmployees.find((e) => e.id === id || e.employeeId === id);
    if (!emp) {
      return { success: false, data: null as unknown as Employee, message: 'Employee not found' };
    }
    return { success: true, data: emp, message: 'Employee details fetched' };
  },

  async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> {
    const realResponse = await fetchApi<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData),
    });
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const newEmp: Employee = {
      ...employeeData,
      id: `emp-${Date.now()}`,
    };
    localEmployees.unshift(newEmp);
    return { success: true, data: newEmp, message: 'Employee created successfully' };
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<ApiResponse<Employee>> {
    const realResponse = await fetchApi<Employee>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const idx = localEmployees.findIndex((e) => e.id === id || e.employeeId === id);
    if (idx === -1) {
      return { success: false, data: null as unknown as Employee, message: 'Employee not found' };
    }

    localEmployees[idx] = { ...localEmployees[idx], ...updates };
    return { success: true, data: localEmployees[idx], message: 'Employee updated successfully' };
  },

  async deleteEmployee(id: string): Promise<ApiResponse<boolean>> {
    const realResponse = await fetchApi<boolean>(`/employees/${id}`, { method: 'DELETE' });
    if (realResponse.success) {
      return realResponse;
    }

    localEmployees = localEmployees.filter((e) => e.id !== id && e.employeeId !== id);
    return { success: true, data: true, message: 'Employee removed successfully' };
  },
};
