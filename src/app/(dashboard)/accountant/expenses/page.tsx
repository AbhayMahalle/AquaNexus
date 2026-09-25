'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import OriginalPage from '@/views/accountant/Expenses';

export default function Page() {
  return (
    <DashboardLayout>
      <OriginalPage />
    </DashboardLayout>
  );
}
