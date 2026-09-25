'use client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import EmployeeDetailPage from '@/views/employees/EmployeeDetailPage';
export default function Page() {
  return (<DashboardLayout><EmployeeDetailPage /></DashboardLayout>);
}
