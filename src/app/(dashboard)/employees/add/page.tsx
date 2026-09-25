'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import OriginalPage from '@/views/employees/AddEmployeePage';

export default function Page() {
  return (
    <DashboardLayout>
      <OriginalPage />
    </DashboardLayout>
  );
}
