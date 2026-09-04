import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import LoginPage from '@/pages/Login';
import AdminDashboardPage from '@/pages/AdminDashboard';
import UserManagementPage from '@/pages/UserManagement';
import RolesPage from '@/pages/Roles';
import PermissionMatrixPage from '@/pages/PermissionMatrix';
import ManagerDashboardPage from '@/pages/ManagerDashboard';
import AttendancePage from '@/pages/Attendance';
import ProductionPage from '@/pages/Production';
import StoreInventoryPage from '@/pages/Inventory';
import DistributionPage from '@/pages/Distribution';
import ReportsPage from '@/pages/Reports';
import FoundationTestPage from '@/pages/FoundationTest';

function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'manager') {
    return <Navigate to="/manager/dashboard" replace />;
  }

  return <Navigate to="/admin/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Admin Shell Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
      <Route path="/admin/users" element={<UserManagementPage />} />
      <Route path="/admin/roles" element={<RolesPage />} />
      <Route path="/admin/permissions" element={<PermissionMatrixPage />} />

      {/* Manager Shell Routes */}
      <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
      <Route path="/manager/attendance" element={<AttendancePage />} />
      <Route path="/manager/production" element={<ProductionPage />} />
      <Route path="/manager/inventory" element={<StoreInventoryPage />} />
      <Route path="/manager/distribution" element={<DistributionPage />} />
      <Route path="/manager/reports" element={<ReportsPage />} />

      {/* Shared Foundation Test Route */}
      <Route path="/foundation-test" element={<FoundationTestPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
