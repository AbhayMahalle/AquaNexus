import type { Leave, ApiResponse } from '../types';
import { fetchApi } from './apiClient';

const MOCK_LEAVES: Leave[] = [
  {
    id: 'leave-1',
    employeeId: 'EMP-1004',
    employeeName: 'Vikram Jadhav',
    department: 'Maintenance',
    leaveType: 'CASUAL',
    startDate: '2026-09-08',
    endDate: '2026-09-10',
    totalDays: 3,
    reason: 'Family medical emergency',
    status: 'APPROVED',
    approvedBy: 'Niranjan (Manager)',
    createdAt: '2026-09-07',
  },
  {
    id: 'leave-2',
    employeeId: 'EMP-1003',
    employeeName: 'Ramesh Pawar',
    department: 'Store',
    leaveType: 'SICK',
    startDate: '2026-09-12',
    endDate: '2026-09-13',
    totalDays: 2,
    reason: 'Viral fever and rest',
    status: 'PENDING',
    createdAt: '2026-09-09',
  },
  {
    id: 'leave-3',
    employeeId: 'EMP-1001',
    employeeName: 'Suresh Kumar',
    department: 'Production',
    leaveType: 'PAID',
    startDate: '2026-09-20',
    endDate: '2026-09-22',
    totalDays: 3,
    reason: 'Annual leave',
    status: 'PENDING',
    createdAt: '2026-09-09',
  },
];

let localLeaves: Leave[] = [...MOCK_LEAVES];

export const leaveService = {
  async getLeaveRequests(params?: { status?: string; search?: string }): Promise<ApiResponse<Leave[]>> {
    const realResponse = await fetchApi<Leave[]>('/leave');
    if (realResponse.success && Array.isArray(realResponse.data)) {
      return realResponse;
    }

    let result = [...localLeaves];
    if (params?.status && params.status !== 'ALL') {
      result = result.filter((l) => l.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.employeeName.toLowerCase().includes(q) ||
          l.employeeId.toLowerCase().includes(q) ||
          l.reason.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: result,
      message: 'Leave requests fetched',
    };
  },

  async getLeaveById(id: string): Promise<ApiResponse<Leave>> {
    const realResponse = await fetchApi<Leave>(`/leave/${id}`);
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const item = localLeaves.find((l) => l.id === id);
    if (!item) {
      return { success: false, data: null as unknown as Leave, message: 'Leave request not found' };
    }
    return { success: true, data: item, message: 'Leave details fetched' };
  },

  async createLeaveRequest(leaveData: Omit<Leave, 'id' | 'status' | 'createdAt'>): Promise<ApiResponse<Leave>> {
    const realResponse = await fetchApi<Leave>('/leave', {
      method: 'POST',
      body: JSON.stringify(leaveData),
    });
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const newLeave: Leave = {
      ...leaveData,
      id: `leave-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0],
    };

    localLeaves.unshift(newLeave);
    return { success: true, data: newLeave, message: 'Leave request submitted successfully' };
  },

  async updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED', approvedBy: string = 'Niranjan (Manager)'): Promise<ApiResponse<Leave>> {
    const realResponse = await fetchApi<Leave>(`/leave/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approvedBy }),
    });
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const idx = localLeaves.findIndex((l) => l.id === id);
    if (idx === -1) {
      return { success: false, data: null as unknown as Leave, message: 'Leave request not found' };
    }

    localLeaves[idx] = { ...localLeaves[idx], status, approvedBy };
    return { success: true, data: localLeaves[idx], message: `Leave request ${status.toLowerCase()}` };
  },
};
