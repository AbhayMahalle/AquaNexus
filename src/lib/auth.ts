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

export const TOKEN_KEY = 'aqua_nexus_token';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export async function loginApi(credentials: LoginCredentials): Promise<AuthResponse> {
  const apiUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) ||
    'http://localhost:5000';

  const endpoint = `${apiUrl}/api/auth/login`;

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credentials.email || credentials.username,
        username: credentials.username || credentials.email,
        password: credentials.password,
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const token = json.data?.token || '';
      const backendUser = json.data?.user;

      if (backendUser) {
        const rawRole = (backendUser.role?.name || backendUser.userRoles?.[0]?.role?.name || '').toLowerCase();
        let mappedRole: UserRole = 'admin';
        if (rawRole === 'manager') mappedRole = 'manager';
        else if (rawRole === 'store_manager') mappedRole = 'store_manager';
        else if (rawRole === 'accountant') mappedRole = 'accountant';
        else if (rawRole === 'distributor') mappedRole = 'distributor';
        else if (rawRole === 'operator') mappedRole = 'operator';
        else if (rawRole === 'admin') mappedRole = 'admin';

        const permissions = backendUser.userRoles?.[0]?.role?.rolePermissions
          ? backendUser.userRoles[0].role.rolePermissions.map((rp: any) => rp.permission?.code).filter(Boolean)
          : [];

        const assignments = backendUser.managerAssignments
          ? backendUser.managerAssignments.map((ma: any) => ma.area.toLowerCase())
          : [];

        const authUser: User = {
          id: backendUser.id,
          name: `${backendUser.firstName || ''} ${backendUser.lastName || ''}`.trim() || backendUser.username || backendUser.email,
          email: backendUser.email,
          username: backendUser.username || backendUser.email,
          role: mappedRole,
          roleTitle: backendUser.role?.description || backendUser.role?.name || mappedRole,
          avatar: (backendUser.firstName?.[0] || backendUser.username?.[0] || 'U').toUpperCase(),
          permissions,
          assignments,
          plantId: 'PLANT-001',
          plantName: 'AquaNexus Main Unit - Pune',
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
          localStorage.setItem(TOKEN_KEY, token);
        }

        return {
          user: authUser,
          token,
          expiresIn: 86400,
        };
      }
    } else if (res.status === 401 || res.status === 403 || res.status === 400) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed (${res.status})`);
    }
  } catch (err: any) {
    if (err?.message && (err.message.includes('Invalid') || err.message.includes('inactive') || err.message.includes('required'))) {
      throw err;
    }
    // Network / Offline fallback below
  }

  // Standalone frontend fallback when backend server is offline
  const input = (credentials.email || credentials.username || '').toLowerCase().trim();
  let matchedUserKey: UserRole | undefined;

  for (const [rKey, uObj] of Object.entries(MOCK_USERS)) {
    if (
      uObj.email.toLowerCase() === input ||
      uObj.username.toLowerCase() === input ||
      (rKey === 'store_manager' && (input === 'storemanager' || input === 'store_mgr')) ||
      (rKey === 'distributor' && (input === 'distributor1' || input === 'distributor'))
    ) {
      matchedUserKey = rKey as UserRole;
      break;
    }
  }

  if (!matchedUserKey && credentials.roleOverride) {
    matchedUserKey = credentials.roleOverride;
  }

  const selectedUser = MOCK_USERS[matchedUserKey || 'admin'] || MOCK_USERS.admin;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedUser));
    localStorage.setItem(TOKEN_KEY, 'mock-jwt-token-dev');
  }

  return {
    user: selectedUser,
    token: 'mock-jwt-token-dev',
    expiresIn: 86400,
  };
}

export function getCurrentUserSync(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUserSync(user: User | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
}