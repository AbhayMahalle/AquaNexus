export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'store_manager'
  | 'accountant'
  | 'distributor'
  | 'supplier'
  | 'employee';

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
  isSuperAdmin?: boolean;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationSlug?: string | null;
  selectedOrganizationId?: string | null;
  selectedOrganizationName?: string | null;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password?: string;
  roleOverride?: UserRole;
  redirectTo?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}