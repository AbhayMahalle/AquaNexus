import type { Employee, ApiResponse } from '@/types';
import { fetchApi } from './apiClient';

function mapEmployee(e: any): Employee {
  return {
    id: e.id,
    employeeId: e.employeeCode || e.id,
    name: `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.name || 'Unnamed Employee',
    department: e.department?.name || e.department || 'General',
    designation: e.designation || 'Staff',
    contactNumber: e.phone || e.contactNumber || '',
    email: e.email || '',
    joiningDate: e.joiningDate ? new Date(e.joiningDate).toISOString().split('T')[0] : '',
    status: e.status === 'ACTIVE' ? 'ACTIVE' : e.status === 'ON_LEAVE' ? 'ON_LEAVE' : 'INACTIVE',
    salary: Number(e.salary || 0),
    address: e.address || '',
  };
}

let cachedDepartments: { id: string; name: string; code: string }[] = [];

async function getDepartmentIdByName(deptNameOrId: string): Promise<string> {
  if (deptNameOrId.length === 36 && deptNameOrId.includes('-')) {
    return deptNameOrId;
  }
  if (cachedDepartments.length === 0) {
    const res = await fetchApi<{ departments: any[] }>('/employees/departments');
    if (res.success && res.data?.departments) {
      cachedDepartments = res.data.departments;
    }
  }
  const match = cachedDepartments.find(
    (d) => d.name.toLowerCase() === deptNameOrId.toLowerCase() || d.code.toLowerCase() === deptNameOrId.toLowerCase()
  );
  return match ? match.id : cachedDepartments[0]?.id || 'c81feea8-4118-49f7-80a9-cbd988445ea1';
}

export const employeeService = {
  async getDepartments(): Promise<ApiResponse<{ id: string; name: string; code: string }[]>> {
    const res = await fetchApi<{ departments: any[] }>('/employees/departments');
    const departments = res.data?.departments || (Array.isArray(res.data) ? res.data : []);
    if (departments.length > 0) {
      cachedDepartments = departments;
    }
    return {
      success: res.success,
      data: departments,
      message: res.message || 'Departments retrieved',
    };
  },

  async getEmployees(params?: { search?: string; department?: string; status?: string }): Promise<ApiResponse<Employee[]>> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    query.append('limit', '50');

    const endpoint = `/employees${query.toString() ? `?${query.toString()}` : ''}`;
    const realResponse = await fetchApi<{ employees: any[]; pagination: any }>(endpoint);

    if (realResponse.success && realResponse.data) {
      const rawList = realResponse.data.employees || (Array.isArray(realResponse.data) ? realResponse.data : []);
      let result = rawList.map(mapEmployee);

      if (params?.department && params.department !== 'ALL') {
        result = result.filter((e) => e.department.toLowerCase() === params.department!.toLowerCase());
      }

      return {
        success: true,
        data: result,
        message: realResponse.message || 'Employees fetched successfully',
        pagination: realResponse.data.pagination || {
          total: result.length,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      };
    }

    return {
      success: false,
      data: [],
      message: realResponse.message || 'Failed to fetch employees',
    };
  },

  async getEmployeeById(id: string): Promise<ApiResponse<Employee>> {
    const realResponse = await fetchApi<any>(`/employees/${id}`);
    if (realResponse.success && realResponse.data) {
      const emp = realResponse.data.employee || realResponse.data;
      return {
        success: true,
        data: mapEmployee(emp),
        message: realResponse.message || 'Employee details fetched',
      };
    }

    return {
      success: false,
      data: null as unknown as Employee,
      message: realResponse.message || 'Employee not found',
    };
  },

  async createEmployee(employeeData: Omit<Employee, 'id'>): Promise<ApiResponse<Employee>> {
    const names = (employeeData.name || '').trim().split(/\s+/);
    const firstName = names[0] || 'Employee';
    const lastName = names.slice(1).join(' ') || firstName;
    const departmentId = await getDepartmentIdByName(employeeData.department || 'Production');

    const payload = {
      firstName,
      lastName,
      employeeCode: employeeData.employeeId || undefined,
      email: employeeData.email || `${firstName.toLowerCase()}.${Date.now().toString().slice(-4)}@aquanexus.com`,
      phone: employeeData.contactNumber || '9876543210',
      departmentId,
      designation: employeeData.designation || 'Staff',
      joiningDate: employeeData.joiningDate || new Date().toISOString(),
      status: employeeData.status || 'ACTIVE',
    };

    const realResponse = await fetchApi<any>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (realResponse.success && realResponse.data) {
      const created = realResponse.data.employee || realResponse.data;
      return {
        success: true,
        data: mapEmployee(created),
        message: realResponse.message || 'Employee created successfully',
      };
    }

    return {
      success: false,
      data: null as unknown as Employee,
      message: realResponse.message || 'Failed to create employee',
    };
  },

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<ApiResponse<Employee>> {
    const payload: any = {};
    if (updates.name) {
      const names = updates.name.trim().split(/\s+/);
      payload.firstName = names[0];
      payload.lastName = names.slice(1).join(' ') || names[0];
    }
    if (updates.designation) payload.designation = updates.designation;
    if (updates.contactNumber) payload.phone = updates.contactNumber;
    if (updates.email) payload.email = updates.email;
    if (updates.status) payload.status = updates.status;
    if (updates.department) {
      payload.departmentId = await getDepartmentIdByName(updates.department);
    }

    const realResponse = await fetchApi<any>(`/employees/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    if (realResponse.success && realResponse.data) {
      const updated = realResponse.data.employee || realResponse.data;
      return {
        success: true,
        data: mapEmployee(updated),
        message: realResponse.message || 'Employee updated successfully',
      };
    }

    return {
      success: false,
      data: null as unknown as Employee,
      message: realResponse.message || 'Failed to update employee',
    };
  },

  async deleteEmployee(id: string): Promise<ApiResponse<boolean>> {
    const realResponse = await fetchApi<boolean>(`/employees/${id}`, { method: 'DELETE' });
    return {
      success: realResponse.success,
      data: realResponse.success,
      message: realResponse.message || (realResponse.success ? 'Employee removed' : 'Failed to delete employee'),
    };
  },
};
