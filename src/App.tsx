import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

import LoginPage from '@/pages/Login';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// ==========================================
// MRUDULA PAGES (Foundation / Admin)
// ==========================================
import AdminDashboardPage from '@/pages/AdminDashboard';
import UserManagementPage from '@/pages/UserManagement';
import RolesPage from '@/pages/Roles';
import PermissionMatrixPage from '@/pages/PermissionMatrix';
import ManagerDashboardPage from '@/pages/ManagerDashboard';
import ReportsPage from '@/pages/Reports';

// ==========================================
// NIRANJAN PAGES (HR & Production)
// ==========================================
import { DashboardOverviewPage } from '@/pages/dashboard/DashboardOverviewPage';
import { EmployeeListPage } from '@/pages/employees/EmployeeListPage';
import { AddEmployeePage } from '@/pages/employees/AddEmployeePage';
import { EmployeeDetailPage } from '@/pages/employees/EmployeeDetailPage';
import { EditEmployeePage } from '@/pages/employees/EditEmployeePage';
import { DailyAttendancePage } from '@/pages/attendance/DailyAttendancePage';
import { MonthlyAttendancePage } from '@/pages/attendance/MonthlyAttendancePage';
import { LeaveListPage } from '@/pages/leave/LeaveListPage';
import { CreateLeavePage } from '@/pages/leave/CreateLeavePage';
import { LeaveDetailPage } from '@/pages/leave/LeaveDetailPage';
import { OvertimeListPage } from '@/pages/overtime/OvertimeListPage';
import { ProductionListPage } from '@/pages/production/ProductionListPage';
import { CreateProductionPage } from '@/pages/production/CreateProductionPage';
import { ProductionDetailPage } from '@/pages/production/ProductionDetailPage';
import { ProductionHistoryPage } from '@/pages/production/ProductionHistoryPage';

// ==========================================
// RAM PAGES (Store & Inventory)
// ==========================================
import {
  StoreDashboardPage,
  InventoryListPage,
  InventoryDetailPage,
  StockInPage,
  StockOutPage,
  GoodsReceivedPage,
  DispatchPage,
  ReturnsPage,
  DamagedGoodsPage,
  LowStockAlertsPage,
  StoreReportsPage,
} from '@/pages/store';

// ==========================================
// YASH PAGES (Distributor & Accountant)
// ==========================================
import { DistributorDashboard } from '@/pages/distributor/Dashboard';
import { DistributorProducts } from '@/pages/distributor/Products';
import { DistributorOrders } from '@/pages/distributor/Orders';
import { CreateOrder } from '@/pages/distributor/CreateOrder';
import { DistributorOrderDetails } from '@/pages/distributor/OrderDetails';
import { DistributorStockPage } from '@/pages/distributor/Stock';
import { DistributorSales } from '@/pages/distributor/Sales';
import { DistributorReturns } from '@/pages/distributor/Returns';
import { DistributorInvoices } from '@/pages/distributor/Invoices';
import { DistributorPayments } from '@/pages/distributor/Payments';
import { DistributorOutstanding } from '@/pages/distributor/Outstanding';

import { AccountantDashboard } from '@/pages/accountant/Dashboard';
import { AccountantPayroll } from '@/pages/accountant/Payroll';
import { AccountantPayments } from '@/pages/accountant/Payments';
import { AccountantExpenses } from '@/pages/accountant/Expenses';
import { AccountantOutstanding } from '@/pages/accountant/Outstanding';
import { AccountantReports } from '@/pages/accountant/Reports';


function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager/dashboard" replace />;
    case 'store_manager':
      return <Navigate to="/store/dashboard" replace />;
    case 'accountant':
      return <Navigate to="/accountant/dashboard" replace />;
    case 'distributor':
      return <Navigate to="/distributor/dashboard" replace />;
    default:
      return <Navigate to="/dashboard" replace />; // fallback
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  return <DashboardLayout>{children}</DashboardLayout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes wrapped with Sidebar layout */}
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <Routes>
              {/* Default Dash */}
              <Route path="/dashboard" element={<DashboardOverviewPage />} />

              {/* === MRUDULA === */}
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/roles" element={<RolesPage />} />
              <Route path="/admin/permissions" element={<PermissionMatrixPage />} />
              <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
              <Route path="/manager/reports" element={<ReportsPage />} />

              {/* === NIRANJAN === */}
              <Route path="/employees" element={<EmployeeListPage />} />
              <Route path="/employees/add" element={<AddEmployeePage />} />
              <Route path="/employees/:id" element={<EmployeeDetailPage />} />
              <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
              <Route path="/attendance" element={<DailyAttendancePage />} />
              <Route path="/attendance/daily" element={<DailyAttendancePage />} />
              <Route path="/attendance/monthly" element={<MonthlyAttendancePage />} />
              <Route path="/leave" element={<LeaveListPage />} />
              <Route path="/leave/create" element={<CreateLeavePage />} />
              <Route path="/leave/:id" element={<LeaveDetailPage />} />
              <Route path="/overtime" element={<OvertimeListPage />} />
              <Route path="/production" element={<ProductionListPage />} />
              <Route path="/production/create" element={<CreateProductionPage />} />
              <Route path="/production/:id" element={<ProductionDetailPage />} />
              <Route path="/production/history" element={<ProductionHistoryPage />} />

              {/* === RAM === */}
              <Route path="/store/dashboard" element={<StoreDashboardPage />} />
              <Route path="/store/inventory" element={<InventoryListPage />} />
              <Route path="/store/inventory/:id" element={<InventoryDetailPage />} />
              <Route path="/store/stock-in" element={<StockInPage />} />
              <Route path="/store/stock-out" element={<StockOutPage />} />
              <Route path="/store/goods-received" element={<GoodsReceivedPage />} />
              <Route path="/store/dispatch" element={<DispatchPage />} />
              <Route path="/store/returns" element={<ReturnsPage />} />
              <Route path="/store/damaged" element={<DamagedGoodsPage />} />
              <Route path="/store/low-stock" element={<LowStockAlertsPage />} />
              <Route path="/store/reports" element={<StoreReportsPage />} />

              {/* === YASH === */}
              <Route path="/distributor/dashboard" element={<DistributorDashboard />} />
              <Route path="/distributor/products" element={<DistributorProducts />} />
              <Route path="/distributor/orders" element={<DistributorOrders />} />
              <Route path="/distributor/orders/create" element={<CreateOrder />} />
              <Route path="/distributor/orders/:id" element={<DistributorOrderDetails />} />
              <Route path="/distributor/stock" element={<DistributorStockPage />} />
              <Route path="/distributor/sales" element={<DistributorSales />} />
              <Route path="/distributor/returns" element={<DistributorReturns />} />
              <Route path="/distributor/invoices" element={<DistributorInvoices />} />
              <Route path="/distributor/payments" element={<DistributorPayments />} />
              <Route path="/distributor/outstanding" element={<DistributorOutstanding />} />

              <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
              <Route path="/accountant/payroll" element={<AccountantPayroll />} />
              <Route path="/accountant/payments" element={<AccountantPayments />} />
              <Route path="/accountant/expenses" element={<AccountantExpenses />} />
              <Route path="/accountant/outstanding" element={<AccountantOutstanding />} />
              <Route path="/accountant/reports" element={<AccountantReports />} />

              {/* Fallback inside Dashboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
