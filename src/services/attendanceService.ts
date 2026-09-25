import type { Attendance, AttendanceStatus, ApiResponse } from '@/types';
import { fetchApi } from './apiClient';

const TODAY = new Date().toISOString().split('T')[0];

function mapAttendance(a: any): Attendance {
  return {
    id: a.id,
    employeeId: a.employee?.employeeCode || a.employeeId,
    employeeName: `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.trim() || 'Employee',
    department: a.employee?.department?.name || 'Operations',
    date: a.attendanceDate ? new Date(a.attendanceDate).toISOString().split('T')[0] : TODAY,
    status: a.status as AttendanceStatus,
    checkIn: a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    checkOut: a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    overtimeHours: a.overtimeHours || 0,
    remarks: a.remarks || undefined,
  };
}

export const attendanceService = {
  async getDailyAttendance(date: string = TODAY, params?: { department?: string; search?: string }): Promise<ApiResponse<Attendance[]>> {
    const query = new URLSearchParams();
    query.append('startDate', date);
    query.append('endDate', date);
    query.append('limit', '100');

    const realResponse = await fetchApi<{ attendance: any[] }>(`/attendance?${query.toString()}`);
    if (realResponse.success && realResponse.data) {
      const rawList = realResponse.data.attendance || (Array.isArray(realResponse.data) ? realResponse.data : []);
      let result = rawList.map(mapAttendance);

      if (params?.search) {
        const q = params.search.toLowerCase();
        result = result.filter((a) => a.employeeName.toLowerCase().includes(q) || a.employeeId.toLowerCase().includes(q));
      }
      if (params?.department && params.department !== 'ALL') {
        result = result.filter((a) => a.department.toLowerCase() === params.department!.toLowerCase());
      }

      return {
        success: true,
        data: result,
        message: realResponse.message || 'Daily attendance fetched',
      };
    }

    return {
      success: false,
      data: [],
      message: realResponse.message || 'Failed to fetch attendance',
    };
  },

  async markAttendance(record: Omit<Attendance, 'id'>): Promise<ApiResponse<Attendance>> {
    const payload = {
      employeeId: record.employeeId,
      attendanceDate: record.date || TODAY,
      status: record.status,
      remarks: record.remarks,
    };

    const realResponse = await fetchApi<any>('/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (realResponse.success && realResponse.data) {
      const item = Array.isArray(realResponse.data.attendance)
        ? realResponse.data.attendance[0]
        : realResponse.data.attendance || realResponse.data;
      return {
        success: true,
        data: mapAttendance(item),
        message: realResponse.message || 'Attendance recorded',
      };
    }

    return {
      success: false,
      data: null as unknown as Attendance,
      message: realResponse.message || 'Failed to record attendance',
    };
  },

  async getMonthlyAttendanceSummary(month: string, year: number): Promise<ApiResponse<any>> {
    const realResponse = await fetchApi<{ attendance: any[] }>('/attendance?limit=200');
    if (realResponse.success && realResponse.data) {
      const rawList = realResponse.data.attendance || (Array.isArray(realResponse.data) ? realResponse.data : []);
      const employeeMap = new Map<string, any>();

      for (const a of rawList) {
        const empCode = a.employee?.employeeCode || a.employeeId;
        const name = `${a.employee?.firstName || ''} ${a.employee?.lastName || ''}`.trim() || 'Employee';
        const dept = a.employee?.department?.name || 'Operations';

        if (!employeeMap.has(empCode)) {
          employeeMap.set(empCode, {
            employeeId: empCode,
            name,
            department: dept,
            totalWorkingDays: 0,
            present: 0,
            absent: 0,
            leave: 0,
            overtimeHours: 0,
          });
        }
        const stat = employeeMap.get(empCode);
        stat.totalWorkingDays += 1;
        if (a.status === 'PRESENT') stat.present += 1;
        else if (a.status === 'ABSENT') stat.absent += 1;
        else if (a.status === 'LEAVE' || a.status === 'ON_LEAVE') stat.leave += 1;
      }

      const summary = Array.from(employeeMap.values());
      return { success: true, data: summary, message: 'Monthly summary calculated' };
    }

    return { success: false, data: [], message: realResponse.message || 'Failed to fetch attendance summary' };
  },
};
