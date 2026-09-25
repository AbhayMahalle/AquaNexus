import { User, UserRole, LoginCredentials, AuthResponse } from '@/types/auth';

const STORAGE_KEY = 'aqua_nexus_auth_user';


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
        else if (rawRole === 'employee') mappedRole = 'employee';
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
    } else {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Login failed (${res.status})`);
    }
  
  throw new Error("Unexpected error during login");
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