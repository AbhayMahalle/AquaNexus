'use client';

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { P2PHub } from '@/components/p2p/P2PHub';

export default function SupplierP2PPage() {
  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-6">
        <P2PHub
          initialPerspective="supplier"
          pageTitle="Vendor Fulfillment Portal (Supplier / Vendor)"
          pageSubtitle="Review assigned purchase orders, accept or reject contracts, generate delivery challans with driver details, dispatch shipments, and submit invoices."
          defaultTab="ORDERS"
        />
      </div>
    </DashboardLayout>
  );
}
