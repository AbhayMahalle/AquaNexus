import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Download, FileText } from 'lucide-react';

export default function ReportsPage() {
  const reports = [
    { title: 'Daily Production & Yield Report', desc: 'Detailed breakdown of purified water liters produced per shift and line loss', date: 'Today' },
    { title: 'Stock & Inventory Ledger (RAM)', desc: 'Caps, bottles, preforms, and finished jar inventory levels with reorder flags', date: 'Today' },
    { title: 'Distributor Sales Summary (YASH)', desc: 'Agency dispatch counts, billing totals, and outstanding collections', date: 'This Month' },
    { title: 'Shift Attendance & Overtime (NIRANJAN)', desc: 'Worker attendance records, shift hours, and overtime calculations', date: 'This Week' },
  ];

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
                  <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                    Download CSV
                  </Button>
                  <Button variant="ghost" size="sm">View Online</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
