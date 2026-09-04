import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, LoginCredentials, Permission } from '@/types/auth';
import { loginApi, getCurrentUserSync, setCurrentUserSync, MOCK_USERS } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
  hasPermission: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const cachedUser = getCurrentUserSync();
    if (cachedUser) {
      setUser(cachedUser);
    } else {
      setUser(MOCK_USERS.admin);
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await loginApi(credentials);
      setUser(response.user);
      
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (response.user.role === 'manager') {
        navigate('/manager/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setCurrentUserSync(null);
    navigate('/login');
  };

  const switchRole = (newRole: UserRole) => {
    const newUser = MOCK_USERS[newRole] || MOCK_USERS.admin;
    setUser(newUser);
    setCurrentUserSync(newUser);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
