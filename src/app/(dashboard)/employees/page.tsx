'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import OriginalPage from '@/views/employees/EmployeeListPage';

export default function Page() {
  return (
    <DashboardLayout>
      <OriginalPage />
    </DashboardLayout>
  );
}
