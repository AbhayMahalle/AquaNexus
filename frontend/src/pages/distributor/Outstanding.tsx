import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { distributorService } from '@/services/distributorService';
import { OutstandingSummary } from '@/types/distributor';
import { formatCurrency } from '@/lib/utils';

export const DistributorOutstanding: React.FC = () => {
  const [summary, setSummary] = useState<OutstandingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOutstanding = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getOutstanding();
    if (res.success && res.data) {
      setSummary(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOutstanding();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <PageHeader title="Distributor Outstanding Balance" />
        <Skeleton className="h-64 w-full" />
      </DashboardLayout>
    );
  }

  if (error || !summary) {
    return (
      <DashboardLayout>
        <PageHeader title="Distributor Outstanding Balance" />
        <ErrorState message={error || 'Failed to load outstanding balance'} onRetry={loadOutstanding} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="Distributor Outstanding Balance"
        description="Backend-calculated financial position detailing pending payable balances to the water plant."
      />

      {/* Main Outstanding Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card hoverEffect className="bg-gradient-to-br from-white to-[#F5F8FB]">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Cumulative Invoiced</span>
          <div className="text-2xl font-bold text-[#172033] mt-2">{formatCurrency(summary.totalInvoiced)}</div>
          <p className="text-xs text-[#64748B] mt-1">All fulfilled order invoices</p>
        </Card>

        <Card hoverEffect className="bg-gradient-to-br from-white to-[#F5F8FB]">
          <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Settled Payments</span>
          <div className="text-2xl font-bold text-[#16A34A] mt-2">{formatCurrency(summary.totalPaid)}</div>
          <p className="text-xs text-[#64748B] mt-1">Confirmed bank payments</p>
        </Card>

        <Card hoverEffect className="bg-white border-[#F59E0B]/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#D97706] uppercase tracking-wider">Net Outstanding Balance</span>
            <AlertCircle className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="text-3xl font-bold text-[#DC2626] mt-2">{formatCurrency(summary.totalOutstanding)}</div>
          <p className="text-xs text-[#64748B] mt-1">Amount due to plant</p>
        </Card>
      </div>

      {/* Aging Schedule Analysis */}
      <Card>
        <h3 className="font-semibold text-base text-[#172033] mb-4 pb-2 border-b border-[#E2E8F0]">
          Outstanding Aging Schedule Breakdown
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-[#F5F8FB] rounded-[8px] border border-[#E2E8F0]">
            <span className="text-xs font-medium text-[#64748B]">Due Within 30 Days</span>
            <p className="text-xl font-bold text-[#0F4C81] mt-1">{formatCurrency(summary.dueWithin30Days)}</p>
            <p className="text-xs text-[#16A34A] mt-1">Standard credit period</p>
          </div>

          <div className="p-4 bg-[#F5F8FB] rounded-[8px] border border-[#E2E8F0]">
            <span className="text-xs font-medium text-[#64748B]">Overdue (31 to 60 Days)</span>
            <p className="text-xl font-bold text-[#F59E0B] mt-1">{formatCurrency(summary.overdue30To60Days)}</p>
            <p className="text-xs text-[#F59E0B] mt-1">Attention required</p>
          </div>

          <div className="p-4 bg-[#F5F8FB] rounded-[8px] border border-[#E2E8F0]">
            <span className="text-xs font-medium text-[#64748B]">Critical Overdue (60+ Days)</span>
            <p className="text-xl font-bold text-[#DC2626] mt-1">{formatCurrency(summary.overdue60PlusDays)}</p>
            <p className="text-xs text-[#DC2626] mt-1">Order hold risk</p>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};
