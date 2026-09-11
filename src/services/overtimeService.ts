import type { Overtime, ApiResponse } from '../types';
import { fetchApi } from './apiClient';

const TODAY = new Date().toISOString().split('T')[0];

const MOCK_OVERTIME: Overtime[] = [
  {
    id: 'ot-1',
    employeeId: 'EMP-1001',
    employeeName: 'Suresh Kumar',
    department: 'Production',
    date: TODAY,
    hours: 2.5,
    rateMultiplier: 1.5,
    status: 'APPROVED',
    approvedBy: 'Niranjan (Manager)',
    payrollAmount: 625,
    notes: 'Shift B extension for 20L bottling target',
  },
  {
    id: 'ot-2',
    employeeId: 'EMP-1004',
    employeeName: 'Vikram Jadhav',
    department: 'Maintenance',
    date: '2026-09-07',
    hours: 3.0,
    rateMultiplier: 1.5,
    status: 'PENDING',
    payrollAmount: 840,
    notes: 'Emergency pump seal replacement',
  },
  {
    id: 'ot-3',
    employeeId: 'EMP-1003',
    employeeName: 'Ramesh Pawar',
    department: 'Store',
    date: '2026-09-06',
    hours: 1.5,
    rateMultiplier: 1.5,
    status: 'APPROVED',
    approvedBy: 'Niranjan (Manager)',
    payrollAmount: 337.5,
    notes: 'Goods dispatch loading for Distributor D-102',
  },
];

let localOvertime: Overtime[] = [...MOCK_OVERTIME];

export const overtimeService = {
  async getOvertimeLogs(params?: { status?: string; search?: string }): Promise<ApiResponse<Overtime[]>> {
    const realResponse = await fetchApi<Overtime[]>('/overtime');
    if (realResponse.success && Array.isArray(realResponse.data)) {
      return realResponse;
    }

    let result = [...localOvertime];
    if (params?.status && params.status !== 'ALL') {
      result = result.filter((o) => o.status === params.status);
    }
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
      message: 'Overtime logs fetched',
    };
  },

  async logOvertime(record: Omit<Overtime, 'id' | 'status' | 'payrollAmount'> & { hourlyRate?: number }): Promise<ApiResponse<Overtime>> {
    const realResponse = await fetchApi<Overtime>('/overtime', {
      method: 'POST',
      body: JSON.stringify(record),
    });
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    // Default rate calculation: approx hourly base * multiplier
    const rate = record.hourlyRate || 200;
    const calculatedAmount = record.hours * rate * record.rateMultiplier;

    const newLog: Overtime = {
      ...record,
      id: `ot-${Date.now()}`,
      status: 'PENDING',
      payrollAmount: Math.round(calculatedAmount),
    };

    localOvertime.unshift(newLog);
    return { success: true, data: newLog, message: 'Overtime recorded successfully' };
  },

  async updateOvertimeStatus(id: string, status: 'APPROVED' | 'REJECTED', approvedBy: string = 'Niranjan (Manager)'): Promise<ApiResponse<Overtime>> {
    const realResponse = await fetchApi<Overtime>(`/overtime/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, approvedBy }),
    });
    if (realResponse.success && realResponse.data) {
      return realResponse;
    }

    const idx = localOvertime.findIndex((o) => o.id === id);
    if (idx === -1) {
      return { success: false, data: null as unknown as Overtime, message: 'Overtime record not found' };
    }

    localOvertime[idx] = { ...localOvertime[idx], status, approvedBy };
    return { success: true, data: localOvertime[idx], message: `Overtime status updated to ${status}` };
  },
};
