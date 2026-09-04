import { User, UserRole, LoginCredentials, AuthResponse } from '@/types/auth';

const STORAGE_KEY = 'aqua_nexus_auth_user';

export const MOCK_USERS: Record<UserRole, User> = {
  admin: {
    id: 'usr_admin_1',
    name: 'Mrudula (Frontend Lead)',
    email: 'admin@aquanexus.com',
    username: 'admin',
    role: 'admin',
    roleTitle: 'System Administrator',
    avatar: 'M',
    permissions: [
      'users.view', 'users.manage',
      'roles.view', 'roles.manage',
      'production.view', 'production.manage',
      'inventory.view', 'inventory.manage',
      'sales.view', 'sales.manage',
      'finance.view', 'finance.manage',
      'reports.view', 'reports.manage',
      'attendance.view', 'attendance.manage'
    ],
    plantId: 'PLANT-001',
    plantName: 'AquaNexus Main Unit - Pune'
  },
  manager: {
    id: 'usr_mgr_1',
    name: 'Suresh Patil',
    email: 'manager@aquanexus.com',
    username: 'manager',
    role: 'manager',
    roleTitle: 'Plant Operations Manager',
    avatar: 'S',
    assignments: ['production', 'store', 'distribution'],
    permissions: [
      'production.view', 'production.manage',
      'inventory.view', 'inventory.manage',
      'reports.view',
      'attendance.view', 'attendance.manage'
    ],
    plantId: 'PLANT-001',
    plantName: 'AquaNexus Main Unit - Pune'
  },
  store_manager: {
    id: 'usr_store_1',
    name: 'Ram (Store Lead)',
    email: 'store@aquanexus.com',
    username: 'store_mgr',
    role: 'store_manager',
    roleTitle: 'Store & Inventory Manager',
    avatar: 'R',
    permissions: ['inventory.view', 'inventory.manage', 'reports.view'],
    plantId: 'PLANT-001',
    plantName: 'AquaNexus Main Unit - Pune'
  },
  accountant: {
    id: 'usr_acc_1',
    name: 'Yash (Finance Lead)',
    email: 'finance@aquanexus.com',
    username: 'accountant',
    role: 'accountant',
    roleTitle: 'Chief Accountant',
    avatar: 'Y',
    permissions: ['finance.view', 'finance.manage', 'sales.view', 'reports.view'],
    plantId: 'PLANT-001',
    plantName: 'AquaNexus Main Unit - Pune'
  },
  distributor: {
    id: 'usr_dist_1',
    name: 'Niranjan (Distributor Lead)',
    email: 'distributor@aquanexus.com',
    username: 'distributor',
    role: 'distributor',
    roleTitle: 'Authorized Agency Distributor',
    avatar: 'N',
    permissions: ['sales.view', 'sales.manage', 'reports.view'],
    plantId: 'PLANT-001',
    plantName: 'AquaNexus Main Unit - Pune'
  },
  operator: {
    id: 'usr_op_1',
    name: 'Ramesh K.',
    email: 'operator@aquanexus.com',
    username: 'operator',
    role: 'operator',
    roleTitle: 'Line Operator',
    avatar: 'R',
    permissions: ['production.view'],
    plantId: 'PLANT-001',
    plantName: 'AquaNexus Main Unit - Pune'
  }
};

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  await new Promise(resolve => setTimeout(resolve, 600));

  const role = credentials.roleOverride || 'admin';
  const selectedUser = MOCK_USERS[role] || MOCK_USERS.admin;

  const authUser: User = {
    ...selectedUser,
    email: credentials.email || selectedUser.email,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
  }

  return {
    user: authUser,
    token: 'mock-jwt-token-aquanexus-' + Date.now(),
    expiresIn: 86400
  };
}

export function getCurrentUserSync(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : MOCK_USERS.admin;
  } catch (e) {
    return MOCK_USERS.admin;
  }
}

export function setCurrentUserSync(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
