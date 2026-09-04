import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { formatCurrency } from '@/lib/utils';

export const AccountantReports: React.FC = () => {
  const [reportType, setReportType] = useState('PROFIT_LOSS');
  const [period, setPeriod] = useState('CURRENT_MONTH');

  return (
    <DashboardLayout>
      <PageHeader
        title="Financial Reports & Statement Hub"
        description="Generate certified plant income statements, expense summaries, and payroll audits."
        action={
          <Button icon={<Download className="w-4 h-4" />} onClick={() => alert(`Exporting ${reportType} report...`)}>
            Export Financial Report
          </Button>
        }
      />

      {/* Control Bar */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              { label: 'Income & Expense Statement (Profit/Loss)', value: 'PROFIT_LOSS' },
              { label: 'Monthly Payroll Audit Report', value: 'PAYROLL_AUDIT' },
              { label: 'Distributor Collections Summary', value: 'DISTRIBUTOR_COLLECTIONS' },
              { label: 'Supplier Payables & Aging Report', value: 'SUPPLIER_PAYABLES' },
            ]}
          />
          <Select
            label="Time Period"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            options={[
              { label: 'Current Month (August 2026)', value: 'CURRENT_MONTH' },
              { label: 'Previous Month (July 2026)', value: 'PREVIOUS_MONTH' },
              { label: 'Financial Year 2026-2027', value: 'FY_2026' },
            ]}
          />
        </div>
      </Card>

      {/* Report Preview */}
      <Card>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0F4C81]/10 text-[#0F4C81] rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                {reportType === 'PROFIT_LOSS' && 'Income & Expense Statement'}
                {reportType === 'PAYROLL_AUDIT' && 'Monthly Payroll Audit'}
                {reportType === 'DISTRIBUTOR_COLLECTIONS' && 'Distributor Collections Statement'}
                {reportType === 'SUPPLIER_PAYABLES' && 'Supplier Aging Statement'}
              </h3>
              <p className="text-xs text-[#64748B]">Period: August 1, 2026 – August 31, 2026</p>
            </div>
          </div>
          <span className="text-xs bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 px-3 py-1 rounded-full font-semibold">
            Certified Ledger Data
          </span>
        </div>

        {/* Financial Statement Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[#F5F8FB] rounded-[8px] border border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Gross Revenue / Collections</span>
            <p className="text-2xl font-bold text-[#16A34A] mt-1">{formatCurrency(160000)}</p>
          </div>
          <div className="p-4 bg-[#F5F8FB] rounded-[8px] border border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Total Operating Expenses + Payroll</span>
            <p className="text-2xl font-bold text-[#DC2626] mt-1">{formatCurrency(154850)}</p>
          </div>
          <div className="p-4 bg-[#F5F8FB] rounded-[8px] border border-[#E2E8F0]">
            <span className="text-xs font-semibold text-[#64748B] uppercase">Net Operating Surplus</span>
            <p className="text-2xl font-bold text-[#0F4C81] mt-1">{formatCurrency(5150)}</p>
          </div>
        </div>

        {/* Detailed Rows Placeholder */}
        <div className="border border-[#E2E8F0] rounded-[8px] overflow-hidden">
          <div className="bg-[#F5F8FB] px-4 py-3 border-b border-[#E2E8F0] font-semibold text-xs text-[#64748B] uppercase flex justify-between">
            <span>Accounting Line Item</span>
            <span>Subtotal (INR)</span>
          </div>
          <div className="divide-y divide-[#E2E8F0] text-sm text-[#172033]">
            <div className="px-4 py-3 flex justify-between">
              <span>Packaged Water Sales Revenue</span>
              <span className="font-semibold text-[#16A34A]">{formatCurrency(160000)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span>Plant Employee Salaries & Overtime</span>
              <span className="font-semibold text-[#DC2626]">{formatCurrency(83550)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span>Utilities & Power Consumption</span>
              <span className="font-semibold text-[#DC2626]">{formatCurrency(38500)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span>Equipment Maintenance & Chemical Filters</span>
              <span className="font-semibold text-[#DC2626]">{formatCurrency(14200)}</span>
            </div>
            <div className="px-4 py-3 flex justify-between">
              <span>Fleet Fuel & Distribution Logistics</span>
              <span className="font-semibold text-[#DC2626]">{formatCurrency(18600)}</span>
            </div>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};
