'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { P2PHub } from '@/components/p2p/P2PHub';

export default function AdminP2PPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <P2PHub
          initialPerspective="admin"
          pageTitle="P2P Central Command Center (Admin Governance & Audit)"
          pageSubtitle="Comprehensive multi-role governance: Monitor lifecycle progress, full timeline milestones, and audit trails across all stages in read-only mode."
          defaultTab="REQUISITIONS"
        />
      </div>
    </DashboardLayout>
  );
}
