import type { Leave, LeaveType, LeaveStatus, ApiResponse } from '@/types';
import { fetchApi } from './apiClient';

function mapLeave(l: any): Leave {
  const start = l.startDate ? new Date(l.startDate) : new Date();
  const end = l.endDate ? new Date(l.endDate) : new Date();
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

  return {
    id: l.id,
    employeeId: l.employee?.employeeCode || l.employeeId,
    employeeName: `${l.employee?.firstName || ''} ${l.employee?.lastName || ''}`.trim() || 'Employee',
    department: l.employee?.department?.name || 'Operations',
    leaveType: (l.leaveType || 'CASUAL') as LeaveType,
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
    totalDays,
    reason: l.reason || '',
    status: (l.status || 'PENDING') as LeaveStatus,
    approvedBy: l.approver ? `${l.approver.firstName || ''} ${l.approver.lastName || ''}`.trim() : undefined,
    createdAt: l.createdAt ? new Date(l.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

export const leaveService = {
  async getLeaveRequests(params?: { status?: string; search?: string }): Promise<ApiResponse<Leave[]>> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    query.append('limit', '50');

    const realResponse = await fetchApi<{ leaves: any[]; pagination: any }>(`/leave?${query.toString()}`);
    if (realResponse.success && realResponse.data) {
      const rawList = realResponse.data.leaves || (Array.isArray(realResponse.data) ? realResponse.data : []);
      let result = rawList.map(mapLeave);

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
        message: realResponse.message || 'Leave requests fetched',
        pagination: realResponse.data.pagination,
      };
    }

    return {
      success: false,
      data: [],
      message: realResponse.message || 'Failed to fetch leave requests',
    };
  },

  async getLeaveById(id: string): Promise<ApiResponse<Leave>> {
    const realResponse = await fetchApi<any>(`/leave/${id}`);
    if (realResponse.success && realResponse.data) {
      const l = realResponse.data.leave || realResponse.data;
      return {
        success: true,
        data: mapLeave(l),
        message: realResponse.message || 'Leave request fetched',
      };
    }

    return {
      success: false,
      data: null as unknown as Leave,
      message: realResponse.message || 'Leave request not found',
    };
  },

  applyLeave(leaveData: Omit<Leave, 'id' | 'createdAt' | 'status'>): Promise<ApiResponse<Leave>> {
    return this.createLeaveRequest(leaveData);
  },

  async createLeaveRequest(leaveData: Omit<Leave, 'id' | 'createdAt' | 'status'>): Promise<ApiResponse<Leave>> {
    const payload = {
      employeeId: leaveData.employeeId,
      leaveType: leaveData.leaveType,
      startDate: new Date(leaveData.startDate).toISOString(),
      endDate: new Date(leaveData.endDate).toISOString(),
      reason: leaveData.reason,
    };

    const realResponse = await fetchApi<any>('/leave', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (realResponse.success && realResponse.data) {
      const created = realResponse.data.leave || realResponse.data;
      return {
        success: true,
        data: mapLeave(created),
        message: realResponse.message || 'Leave application submitted successfully',
      };
    }

    return {
      success: false,
      data: null as unknown as Leave,
      message: realResponse.message || 'Failed to submit leave',
    };
  },

  async updateLeaveStatus(id: string, status: LeaveStatus): Promise<ApiResponse<Leave>> {
    const realResponse = await fetchApi<any>(`/leave/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (realResponse.success && realResponse.data) {
      const updated = realResponse.data.leave || realResponse.data;
      return {
        success: true,
        data: mapLeave(updated),
        message: realResponse.message || `Leave request ${status.toLowerCase()}`,
      };
    }

    return {
      success: false,
      data: null as unknown as Leave,
      message: realResponse.message || 'Failed to update leave status',
    };
  },
};
