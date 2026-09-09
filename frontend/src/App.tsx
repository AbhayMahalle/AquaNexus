import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Feature Pages
import { DashboardOverviewPage } from './pages/dashboard/DashboardOverviewPage';
import { EmployeeListPage } from './pages/employees/EmployeeListPage';
import { AddEmployeePage } from './pages/employees/AddEmployeePage';
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage';
import { EditEmployeePage } from './pages/employees/EditEmployeePage';
import { DailyAttendancePage } from './pages/attendance/DailyAttendancePage';
import { MonthlyAttendancePage } from './pages/attendance/MonthlyAttendancePage';
import { LeaveListPage } from './pages/leave/LeaveListPage';
import { CreateLeavePage } from './pages/leave/CreateLeavePage';
import { LeaveDetailPage } from './pages/leave/LeaveDetailPage';
import { OvertimeListPage } from './pages/overtime/OvertimeListPage';
import { ProductionListPage } from './pages/production/ProductionListPage';
import { CreateProductionPage } from './pages/production/CreateProductionPage';
import { ProductionDetailPage } from './pages/production/ProductionDetailPage';
import { ProductionHistoryPage } from './pages/production/ProductionHistoryPage';

export function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<DashboardOverviewPage />} />

          {/* Employee Routes */}
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employees/add" element={<AddEmployeePage />} />
          <Route path="/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/employees/:id/edit" element={<EditEmployeePage />} />

          {/* Attendance Routes */}
          <Route path="/attendance" element={<DailyAttendancePage />} />
          <Route path="/attendance/daily" element={<DailyAttendancePage />} />
          <Route path="/attendance/monthly" element={<MonthlyAttendancePage />} />

          {/* Leave Routes */}
          <Route path="/leave" element={<LeaveListPage />} />
          <Route path="/leave/create" element={<CreateLeavePage />} />
          <Route path="/leave/:id" element={<LeaveDetailPage />} />

          {/* Overtime Routes */}
          <Route path="/overtime" element={<OvertimeListPage />} />

          {/* Production Routes */}
          <Route path="/production" element={<ProductionListPage />} />
          <Route path="/production/create" element={<CreateProductionPage />} />
          <Route path="/production/:id" element={<ProductionDetailPage />} />
          <Route path="/production/history" element={<ProductionHistoryPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;
