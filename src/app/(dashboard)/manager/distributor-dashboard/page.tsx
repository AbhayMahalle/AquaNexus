'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import OriginalPage from '@/views/distributor/Dashboard';

export default function Page() {
  return (
    <DashboardLayout>
      <OriginalPage />
    </DashboardLayout>
  );
}
