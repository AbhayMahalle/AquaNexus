'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { P2PHub } from '@/components/p2p/P2PHub';

export default function StoreP2PPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <P2PHub
          initialPerspective="store_manager"
          pageTitle="Store Procurement & Gate Inward (Store Manager)"
          pageSubtitle="Initiate quantity requests (PR), issue approved purchase orders, inspect physical shipments, and inward accepted stock to central store."
          defaultTab="REQUISITIONS"
        />
      </div>
    </DashboardLayout>
  );
}
