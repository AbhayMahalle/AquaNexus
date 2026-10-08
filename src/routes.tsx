import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Root and Auth Pages
import HomePage from '@/app/page';
import LoginPage from '@/app/login/page';
import { PlaceholderPage } from '@/components/layout/PlaceholderPage';

// Admin Pages
import AdminDashboardPage from '@/app/(dashboard)/admin/dashboard/page';
import { EmployeeDashboardPage } from '@/pages/employee/EmployeeDashboard';
import { ProfilePage } from '@/pages/shared/ProfilePage';
import { EmployeeNotificationsPage } from '@/pages/employee/EmployeeNotificationsPage';
import AdminUsersPage from '@/app/(dashboard)/admin/users/page';
import AdminRolesPage from '@/app/(dashboard)/admin/roles/page';
import SuperAdminOrganizationsPage from '@/app/(dashboard)/superadmin/organizations/page';
import AdminStoreManagerDashboardPage from '@/app/(dashboard)/admin/store-manager-oversight/dashboard/page';

import AdminManagerDashboardPage from '@/app/(dashboard)/admin/manager-dashboard/page';
import AdminStoreDashboardPage from '@/app/(dashboard)/admin/store-dashboard/page';
import AdminDistributorDashboardPage from '@/app/(dashboard)/admin/distributor-dashboard/page';
import AdminAccountantDashboardPage from '@/app/(dashboard)/admin/accountant-dashboard/page';


import AdminManagerAssignmentsPage from '@/app/(dashboard)/admin/manager-assignments/page';
import AdminDepartmentsPage from '@/app/(dashboard)/admin/departments/page';
import AdminAuditLogsPage from '@/app/(dashboard)/admin/audit-logs/page';

import ManagerDepartmentsPage from '@/app/(dashboard)/manager/departments/page';

import StoreProductsPage from '@/app/(dashboard)/store/products/page';
import StoreStockTransactionsPage from '@/app/(dashboard)/store/stock-transactions/page';

import DistributorDispatchPage from '@/app/(dashboard)/distributor/dispatch/page';

import AccountantSuppliersPage from '@/app/(dashboard)/accountant/suppliers/page';

// P2P Pages
import AdminP2PPage from '@/app/(dashboard)/admin/p2p/page';
import ManagerP2PPage from '@/app/(dashboard)/manager/p2p/page';
import StoreP2PPage from '@/app/(dashboard)/store/p2p/page';
import SupplierP2PPage from '@/app/(dashboard)/supplier/p2p/page';
import AccountantP2PPage from '@/app/(dashboard)/accountant/p2p/page';

// Accountant Pages
import AccountantDashboardPage from '@/app/(dashboard)/accountant/dashboard/page';
import AccountantPayrollPage from '@/app/(dashboard)/accountant/payroll/page';
import AccountantDeductionsPage from '@/app/(dashboard)/accountant/deductions/page';
import AccountantPaymentsPage from '@/app/(dashboard)/accountant/payments/page';
import AccountantOutstandingPage from '@/app/(dashboard)/accountant/outstanding/page';
import AccountantExpensesPage from '@/app/(dashboard)/accountant/expenses/page';
import AccountantReportsPage from '@/app/(dashboard)/accountant/reports/page';

// Manager Pages
import ManagerDashboardPage from '@/app/(dashboard)/manager/dashboard/page';

import ManagerDistributionPage from '@/app/(dashboard)/manager/distribution/page';
import ManagerReportsPage from '@/app/(dashboard)/manager/reports/page';

import ManagerStoreDashboardPage from '@/app/(dashboard)/manager/store-dashboard/page';
import ManagerDistributorDashboardPage from '@/app/(dashboard)/manager/distributor-dashboard/page';
import ManagerAccountantDashboardPage from '@/app/(dashboard)/manager/accountant-dashboard/page';

// Store Pages
import StoreDashboardPage from '@/app/(dashboard)/store/dashboard/page';
import StoreInventoryPage from '@/app/(dashboard)/store/inventory/page';
import StoreInventoryDetailPage from '@/app/(dashboard)/store/inventory/[id]/page';
import StoreDamagedPage from '@/app/(dashboard)/store/damaged/page';
import StoreReturnsPage from '@/app/(dashboard)/store/returns/page';
import StoreStockInPage from '@/app/(dashboard)/store/stock-in/page';
import StoreStockOutPage from '@/app/(dashboard)/store/stock-out/page';
import StoreGoodsReceivedPage from '@/app/(dashboard)/store/goods-received/page';
import StoreDispatchPage from '@/app/(dashboard)/store/dispatch/page';
import StoreReportsPage from '@/app/(dashboard)/store/reports/page';

// Distributor Pages
import DistributorDashboardPage from '@/app/(dashboard)/distributor/dashboard/page';
import DistributorProductsPage from '@/app/(dashboard)/distributor/products/page';
import DistributorOrdersPage from '@/app/(dashboard)/distributor/orders/page';
import DistributorCreateOrderPage from '@/app/(dashboard)/distributor/orders/create/page';
import DistributorOrderDetailPage from '@/app/(dashboard)/distributor/orders/[id]/page';
import DistributorStockPage from '@/app/(dashboard)/distributor/stock/page';
import DistributorSalesPage from '@/app/(dashboard)/distributor/sales/page';
import DistributorReturnsPage from '@/app/(dashboard)/distributor/returns/page';
import DistributorInvoicesPage from '@/app/(dashboard)/distributor/invoices/page';
import DistributorPaymentsPage from '@/app/(dashboard)/distributor/payments/page';
import DistributorOutstandingPage from '@/app/(dashboard)/distributor/outstanding/page';

// Shared HR, Production, Leave, Attendance Pages
import EmployeesListPage from '@/app/(dashboard)/employees/page';
import AddEmployeePage from '@/app/(dashboard)/employees/add/page';
import EmployeeDetailPage from '@/app/(dashboard)/employees/[id]/page';
import EditEmployeePage from '@/app/(dashboard)/employees/[id]/edit/page';
import AttendancePage from '@/app/(dashboard)/attendance/page';
import DailyAttendancePage from '@/app/(dashboard)/attendance/daily/page';
import MonthlyAttendancePage from '@/app/(dashboard)/attendance/monthly/page';
import LeaveListPage from '@/app/(dashboard)/leave/page';
import CreateLeavePage from '@/app/(dashboard)/leave/create/page';
import LeaveDetailPage from '@/app/(dashboard)/leave/[id]/page';
import OvertimePage from '@/app/(dashboard)/overtime/page';
import ProductionListPage from '@/app/(dashboard)/production/page';
import CreateProductionPage from '@/app/(dashboard)/production/create/page';
import ProductionHistoryPage from '@/app/(dashboard)/production/history/page';
import ProductionDetailPage from '@/app/(dashboard)/production/[id]/page';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomePage />} />

      {/* Authenticated Dashboard Routes */}
      <Route
        element={
          <AuthGuard>
            <Outlet />
          </AuthGuard>
        }
      >
        {/* SuperAdmin Only */}
        <Route
          path="/superadmin"
          element={
            <AuthGuard allowedRoles={['super_admin']}>
              <Navigate to="/superadmin/organizations" replace />
            </AuthGuard>
          }
        />
        <Route
          path="/superadmin/organizations"
          element={
            <AuthGuard allowedRoles={['super_admin']}>
              <SuperAdminOrganizationsPage />
            </AuthGuard>
          }
        />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/roles" element={<AdminRolesPage />} />
        <Route path="/admin/managers" element={<AdminUsersPage />} />
        <Route path="/admin/employees" element={<EmployeesListPage />} />
        <Route path="/admin/employees/add" element={<AddEmployeePage />} />
        <Route path="/admin/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/admin/employees/:id/edit" element={<EditEmployeePage />} />
        <Route path="/admin/store-manager-oversight/dashboard" element={<AdminStoreManagerDashboardPage />} />
        <Route path="/admin/attendance" element={<AttendancePage />} />
        <Route path="/admin/production" element={<ProductionListPage />} />
        <Route path="/admin/production/create" element={<CreateProductionPage />} />
        <Route path="/admin/production/:id" element={<ProductionDetailPage />} />
        <Route path="/admin/store/inventory" element={<StoreInventoryPage />} />
        <Route path="/admin/distribution" element={<ManagerDistributionPage />} />
        <Route path="/admin/reports" element={<ManagerReportsPage />} />

        <Route path="/admin/manager-dashboard" element={<AdminManagerDashboardPage />} />
        <Route path="/admin/store-dashboard" element={<AdminStoreDashboardPage />} />
        <Route path="/admin/distributor-dashboard" element={<AdminDistributorDashboardPage />} />
        <Route path="/admin/accountant-dashboard" element={<AdminAccountantDashboardPage />} />

        {/* Accountant */}
        <Route path="/accountant/dashboard" element={<AccountantDashboardPage />} />

        <Route path="/accountant/invoices" element={<DistributorInvoicesPage />} />
        <Route path="/accountant/payroll" element={<AccountantPayrollPage />} />
        <Route path="/accountant/deductions" element={<AccountantDeductionsPage />} />
        <Route path="/accountant/payments" element={<AccountantPaymentsPage />} />
        <Route path="/accountant/outstanding" element={<AccountantOutstandingPage />} />
        <Route path="/accountant/expenses" element={<AccountantExpensesPage />} />
        <Route path="/accountant/reports" element={<AccountantReportsPage />} />

        {/* Manager */}
        <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
        <Route path="/manager/employees" element={<EmployeesListPage />} />
        <Route path="/manager/employees/add" element={<AddEmployeePage />} />
        <Route path="/manager/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/manager/employees/:id/edit" element={<EditEmployeePage />} />

        <Route path="/manager/leave" element={<LeaveListPage />} />
        <Route path="/manager/overtime" element={<OvertimePage />} />
        <Route path="/manager/attendance" element={<AttendancePage />} />
        <Route path="/manager/production" element={<ProductionListPage />} />
        <Route path="/manager/production/create" element={<CreateProductionPage />} />
        <Route path="/manager/production/:id" element={<ProductionDetailPage />} />
        <Route path="/manager/store/inventory" element={<StoreInventoryPage />} />
        <Route path="/manager/distribution" element={<ManagerDistributionPage />} />
        <Route path="/manager/reports" element={<ManagerReportsPage />} />

        <Route path="/manager/store-dashboard" element={<ManagerStoreDashboardPage />} />
        <Route path="/manager/distributor-dashboard" element={<ManagerDistributorDashboardPage />} />
        <Route path="/manager/accountant-dashboard" element={<ManagerAccountantDashboardPage />} />

        {/* Store */}
        <Route path="/store/dashboard" element={<StoreDashboardPage />} />
        <Route path="/store/inventory" element={<StoreInventoryPage />} />
        <Route path="/store/inventory/:id" element={<StoreInventoryDetailPage />} />

        <Route path="/store/damaged" element={<StoreDamagedPage />} />
        <Route path="/store/returns" element={<StoreReturnsPage />} />
        <Route path="/store/stock-in" element={<StoreStockInPage />} />
        <Route path="/store/stock-out" element={<StoreStockOutPage />} />
        <Route path="/store/goods-received" element={<StoreGoodsReceivedPage />} />
        <Route path="/store/dispatch" element={<StoreDispatchPage />} />

        <Route path="/store/reports" element={<StoreReportsPage />} />

        {/* Employee */}
        <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
        <Route path="/employee/profile" element={<ProfilePage />} />
        <Route path="/employee/attendance" element={<AttendancePage />} />
        <Route path="/employee/leave" element={<LeaveListPage />} />
        <Route path="/employee/overtime" element={<OvertimePage />} />
        <Route path="/employee/notifications" element={<EmployeeNotificationsPage />} />

        {/* Distributor */}
        <Route path="/distributor/dashboard" element={<DistributorDashboardPage />} />
        <Route path="/distributor/products" element={<DistributorProductsPage />} />
        <Route path="/distributor/orders" element={<DistributorOrdersPage />} />
        <Route path="/distributor/orders/create" element={<DistributorCreateOrderPage />} />
        <Route path="/distributor/orders/:id" element={<DistributorOrderDetailPage />} />
        <Route path="/distributor/stock" element={<DistributorStockPage />} />
        <Route path="/distributor/sales" element={<DistributorSalesPage />} />
        <Route path="/distributor/returns" element={<DistributorReturnsPage />} />
        <Route path="/distributor/invoices" element={<DistributorInvoicesPage />} />
        <Route path="/distributor/payments" element={<DistributorPaymentsPage />} />
        <Route path="/distributor/outstanding" element={<DistributorOutstandingPage />} />


        {/* Shared Operational Modules */}
        <Route path="/employees" element={<EmployeesListPage />} />
        <Route path="/employees/add" element={<AddEmployeePage />} />
        <Route path="/employees/:id" element={<EmployeeDetailPage />} />
        <Route path="/employees/:id/edit" element={<EditEmployeePage />} />
        <Route path="/attendance" element={<AttendancePage />} />
        <Route path="/attendance/daily" element={<DailyAttendancePage />} />
        <Route path="/attendance/monthly" element={<MonthlyAttendancePage />} />
        <Route path="/leave" element={<LeaveListPage />} />
        <Route path="/leave/create" element={<CreateLeavePage />} />
        <Route path="/leave/:id" element={<LeaveDetailPage />} />
        <Route path="/overtime" element={<OvertimePage />} />
        <Route path="/production" element={<ProductionListPage />} />
        <Route path="/production/create" element={<CreateProductionPage />} />
        <Route path="/production/history" element={<ProductionHistoryPage />} />
        <Route path="/production/:id" element={<ProductionDetailPage />} />
        
        {/* Missing pages */}
        <Route path="/admin/manager-assignments" element={<AdminManagerAssignmentsPage />} />
        <Route path="/admin/departments" element={<AdminDepartmentsPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="/manager/departments" element={<ManagerDepartmentsPage />} />
        <Route path="/store/products" element={<StoreProductsPage />} />
        <Route path="/store/stock-transactions" element={<StoreStockTransactionsPage />} />
        <Route path="/accountant/suppliers" element={<AccountantSuppliersPage />} />
        
        {/* P2P Procurement-to-Pay Routes */}
        <Route path="/admin/p2p" element={<AdminP2PPage />} />
        <Route path="/manager/p2p" element={<ManagerP2PPage />} />
        <Route path="/store/p2p" element={<StoreP2PPage />} />
        <Route path="/supplier/p2p" element={<SupplierP2PPage />} />
        <Route path="/vendor/p2p" element={<SupplierP2PPage />} />
        <Route path="/accountant/p2p" element={<AccountantP2PPage />} />


      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
