import type { Overtime, OvertimeStatus, ApiResponse } from '@/types';
import { fetchApi } from './apiClient';

const TODAY = new Date().toISOString().split('T')[0];

function mapOvertime(o: any): Overtime {
  const hours = Number(o.hours || 0);
  const rateMultiplier = 1.5;
  const baseHourlyRate = 150;
  const payrollAmount = Number(o.amount || hours * baseHourlyRate * rateMultiplier);

  return {
    id: o.id,
    employeeId: o.employee?.employeeCode || o.employeeId,
    employeeName: `${o.employee?.firstName || ''} ${o.employee?.lastName || ''}`.trim() || 'Employee',
    department: o.employee?.department?.name || 'Operations',
    date: o.overtimeDate ? new Date(o.overtimeDate).toISOString().split('T')[0] : TODAY,
    hours,
    rateMultiplier,
    status: (o.status || 'PENDING') as OvertimeStatus,
    approvedBy: o.approver ? `${o.approver.firstName || ''} ${o.approver.lastName || ''}`.trim() : undefined,
    payrollAmount,
    notes: o.reason || '',
  };
}

export const overtimeService = {
  async getOvertimeLogs(params?: { status?: string; search?: string }): Promise<ApiResponse<Overtime[]>> {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    query.append('limit', '50');

    const realResponse = await fetchApi<{ overtimes: any[]; pagination: any }>(`/overtime?${query.toString()}`);
    if (realResponse.success && realResponse.data) {
      const rawList = realResponse.data.overtimes || (Array.isArray(realResponse.data) ? realResponse.data : []);
      let result = rawList.map(mapOvertime);

      if (params?.search) {
        const q = params.search.toLowerCase();
        result = result.filter(
          (o) =>
            o.employeeName.toLowerCase().includes(q) ||
            o.employeeId.toLowerCase().includes(q) ||
            (o.notes && o.notes.toLowerCase().includes(q))
        );
      }

      return {
        success: true,
        data: result,
        message: realResponse.message || 'Overtime records fetched',
        pagination: realResponse.data.pagination,
      };
    }

    return {
      success: false,
      data: [],
      message: realResponse.message || 'Failed to fetch overtime records',
    };
  },

  async logOvertime(record: Omit<Overtime, 'id' | 'status' | 'payrollAmount'>): Promise<ApiResponse<Overtime>> {
    const payload = {
      employeeId: record.employeeId,
      overtimeDate: new Date(record.date || TODAY).toISOString(),
      hours: Number(record.hours),
      reason: record.notes || 'Shift overtime work',
    };

    const realResponse = await fetchApi<any>('/overtime', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (realResponse.success && realResponse.data) {
      const created = realResponse.data.overtime || realResponse.data;
      return {
        success: true,
        data: mapOvertime(created),
        message: realResponse.message || 'Overtime logged successfully',
      };
    }

    return {
      success: false,
      data: null as unknown as Overtime,
      message: realResponse.message || 'Failed to log overtime',
    };
  },

  async updateOvertimeStatus(id: string, status: OvertimeStatus): Promise<ApiResponse<Overtime>> {
    const realResponse = await fetchApi<any>(`/overtime/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    if (realResponse.success && realResponse.data) {
      const updated = realResponse.data.overtime || realResponse.data;
      return {
        success: true,
        data: mapOvertime(updated),
        message: realResponse.message || `Overtime status updated to ${status.toLowerCase()}`,
      };
    }

    return {
      success: false,
      data: null as unknown as Overtime,
      message: realResponse.message || 'Failed to update overtime status',
    };
  },
};
