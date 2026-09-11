export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';

export interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  contactNumber: string;
  email: string;
  joiningDate: string;
  status: EmployeeStatus;
  salary: number;
  address?: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LATE' | 'ON_LEAVE';

export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  overtimeHours?: number;
  remarks?: string;
}

export type LeaveType = 'SICK' | 'CASUAL' | 'PAID' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Leave {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedBy?: string;
  createdAt: string;
}

export type OvertimeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Overtime {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  hours: number;
  rateMultiplier: number;
  status: OvertimeStatus;
  approvedBy?: string;
  payrollAmount: number;
  notes?: string;
}

export type ProductionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type GoodsReceivedStatus = 'PENDING' | 'RECEIVED';

export interface Production {
  id: string;
  batchNumber: string;
  productId: string;
  productName: string;
  quantityProduced: number;
  unit: string;
  productionDate: string;
  shift: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  supervisor: string;
  status: ProductionStatus;
  goodsReceivedStatus: GoodsReceivedStatus;
  notes?: string;
}

export interface Product {
  id: string;
  productId: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
}
