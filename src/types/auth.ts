export type UserRole = 
  | 'admin' 
  | 'manager' 
  | 'store_manager' 
  | 'accountant' 
  | 'distributor' 
  | 'operator';

export type ManagerAssignment = 
  | 'production' 
  | 'store' 
  | 'distribution' 
  | 'finance' 
  | 'hr';

export type Permission = 
  | 'users.view' | 'users.manage'
  | 'roles.view' | 'roles.manage'
  | 'production.view' | 'production.manage'
  | 'inventory.view' | 'inventory.manage'
  | 'sales.view' | 'sales.manage'
  | 'finance.view' | 'finance.manage'
  | 'reports.view' | 'reports.manage'
  | 'attendance.view' | 'attendance.manage';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  roleTitle: string;
  avatar?: string;
  permissions: Permission[];
  assignments?: ManagerAssignment[];
  plantId?: string;
  plantName?: string;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
  roleOverride?: UserRole;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}
