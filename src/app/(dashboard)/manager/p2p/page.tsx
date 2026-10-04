'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { P2PHub } from '@/components/p2p/P2PHub';

export default function ManagerP2PPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <P2PHub
          initialPerspective="manager"
          pageTitle="Rate Finalisation & Approval (Operational Manager)"
          pageSubtitle="Review store requisitions, allocate certified vendors, negotiate and finalize item rates, and approve or reject procurement requests."
          defaultTab="REQUISITIONS"
        />
      </div>
    </DashboardLayout>
  );
}
