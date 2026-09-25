'use client';
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { showToast, exportToCSV } from '@/lib/api';
import { Download, FileText, ExternalLink } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    {
      id: 'prod-yield',
      title: 'Daily Production & Yield Report',
      desc: 'Detailed breakdown of purified water liters produced per shift and line efficiency',
      date: 'Today',
      sampleData: [
        { shift: 'Morning Shift A', product: '20L Mineral Water Jar', target: 2000, actual: 1980, efficiency: '99%' },
        { shift: 'Afternoon Shift B', product: '1L Water Bottle Case', target: 1500, actual: 1475, efficiency: '98.3%' },
        { shift: 'Night Shift C', product: '500ml Bottle Pack', target: 1200, actual: 1190, efficiency: '99.1%' },
      ],
      columns: [
        { key: 'shift', header: 'Production Shift' },
        { key: 'product', header: 'Product Type' },
        { key: 'target', header: 'Target Units' },
        { key: 'actual', header: 'Actual Output' },
        { key: 'efficiency', header: 'Efficiency' },
      ],
    },
    {
      id: 'stock-ledger',
      title: 'Stock & Inventory Ledger',
      desc: 'Caps, bottles, preforms, and finished jar inventory levels with reorder thresholds',
      date: 'Today',
      sampleData: [
        { item: 'PET Preforms (20L)', category: 'Raw Materials', available: 4500, minThreshold: 1000, status: 'In Stock' },
        { item: 'Dispenser Caps (55mm)', category: 'Packaging', available: 12000, minThreshold: 2500, status: 'In Stock' },
        { item: '20L Finished Jars', category: 'Finished Goods', available: 320, minThreshold: 500, status: 'Low Stock' },
      ],
      columns: [
        { key: 'item', header: 'Item Name' },
        { key: 'category', header: 'Category' },
        { key: 'available', header: 'Available Units' },
        { key: 'minThreshold', header: 'Reorder Level' },
        { key: 'status', header: 'Status' },
      ],
    },
    {
      id: 'dist-sales',
      title: 'Distributor Sales Summary',
      desc: 'Agency dispatch counts, billing totals, and outstanding collections',
      date: 'This Month',
      sampleData: [
        { agency: 'AquaFlow Distribution (North)', dispatched: 1450, totalBilled: '₹65,250', paid: '₹55,000', balance: '₹10,250' },
        { agency: 'Crystal Pure Agencies (South)', dispatched: 980, totalBilled: '₹44,100', paid: '₹44,100', balance: '₹0' },
        { agency: 'Metro Water Supply (Central)', dispatched: 1200, totalBilled: '₹54,000', paid: '₹40,000', balance: '₹14,000' },
      ],
      columns: [
        { key: 'agency', header: 'Agency Name' },
        { key: 'dispatched', header: 'Dispatched Units' },
        { key: 'totalBilled', header: 'Total Billed' },
        { key: 'paid', header: 'Paid Amount' },
        { key: 'balance', header: 'Outstanding Balance' },
      ],
    },
    {
      id: 'attendance-ot',
      title: 'Shift Attendance & Overtime Log',
      desc: 'Worker attendance records, shift hours, and overtime calculations',
      date: 'This Week',
      sampleData: [
        { empId: 'EMP-1001', name: 'Suresh Kumar', dept: 'Production', daysPresent: 6, otHours: 8, status: 'Active' },
        { empId: 'EMP-1002', name: 'Anjali Sharma', dept: 'QA / Lab', daysPresent: 5, otHours: 2, status: 'Active' },
        { empId: 'EMP-1003', name: 'Ramesh Pawar', dept: 'Store & Warehouse', daysPresent: 6, otHours: 4.5, status: 'Active' },
      ],
      columns: [
        { key: 'empId', header: 'Employee ID' },
        { key: 'name', header: 'Employee Name' },
        { key: 'dept', header: 'Department' },
        { key: 'daysPresent', header: 'Days Present' },
        { key: 'otHours', header: 'Overtime (Hrs)' },
        { key: 'status', header: 'Status' },
      ],
    },
  ];

  const handleDownload = (rep: (typeof reports)[0]) => {
    exportToCSV(rep.sampleData as Record<string, any>[], rep.columns, rep.id);
  };

  const handleViewOnline = (rep: (typeof reports)[0]) => {
    showToast(`Viewing ${rep.title} online report`, 'info');
  };

  return (
    <AuthGuard allowedRoles={['manager', 'admin', 'accountant', 'store_manager']}>
      <DashboardLayout>
        <PageHeader
          title="Operational Reports & Analytics"
          description="Exportable PDF / Excel logs for plant management auditing"
          breadcrumbs={[{ label: 'Operations' }, { label: 'Reports' }]}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((rep, idx) => (
            <Card key={idx} variant="interactive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0F4C81]" />
                  <span>{rep.title}</span>
                </CardTitle>
                <span className="text-xs text-[#64748B]">{rep.date}</span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[#64748B] leading-relaxed">{rep.desc}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={() => handleDownload(rep)}
                  >
                    Download CSV
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => handleViewOnline(rep)}
                  >
                    View Online
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}