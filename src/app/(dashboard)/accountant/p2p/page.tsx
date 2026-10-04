'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { P2PHub } from '@/components/p2p/P2PHub';

export default function AccountantP2PPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <P2PHub
          initialPerspective="accountant"
          pageTitle="P2P Invoices, 3-Way Match & Settlements (Accountant)"
          pageSubtitle="Perform automated 3-Way Match (Purchase Order vs Goods Received vs Vendor Invoice), approve or reject invoices, and execute bank payments."
          defaultTab="INVOICES"
        />
      </div>
    </DashboardLayout>
  );
}
