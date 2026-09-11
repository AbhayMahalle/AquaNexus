import React from 'react';
import { Download, PieChart, TrendingUp, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChartWrapper } from '@/components/charts/BarChartWrapper';
import { DonutChartWrapper } from '@/components/charts/DonutChartWrapper';
import { formatCurrency } from '@/lib/utils';

export const AccountantReports: React.FC = () => {
  const pnlData = [
    { category: 'Distributor Collections', amount: 260000 },
    { category: 'Operational Expenses', amount: -108100 },
    { category: 'Employee Payroll', amount: -123000 },
    { category: 'Net Plant Operating Surplus', amount: 28900 },
  ];

  const expenseBreakdown = [
    { name: 'Power & Water Utilities', value: 64200, color: '#0F4C81' },
    { name: 'Purification Chemical Media', value: 28500, color: '#1597D4' },
    { name: 'Delivery Fleet Diesel', value: 15400, color: '#22B8CF' },
  ];

  const quarterlyComparison = [
    { quarter: 'Q1 2026', revenue: 620000, profit: 145000 },
    { quarter: 'Q2 2026', revenue: 740000, profit: 182000 },
    { quarter: 'Q3 2026 (Est)', revenue: 810000, profit: 205000 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Financial & Accounting Reports"
        description="Authoritative financial statements, revenue surplus reports, and expenditure breakdowns."
        breadcrumb={['AquaNexus', 'Accountant', 'Reports']}
        action={
          <Button onClick={() => alert('Exporting Financial Report PDF...')} icon={Download}>
            Export Financial Report (PDF)
          </Button>
        }
      />

      {/* Profit & Loss Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Current Month Operating Profit & Loss Statement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border text-sm">
            {pnlData.map((row, idx) => (
              <div key={idx} className="py-3 flex justify-between items-center">
                <span className={idx === pnlData.length - 1 ? 'font-extrabold text-textPrimary text-base' : 'text-textSecondary'}>
                  {row.category}
                </span>
                <span
                  className={
                    row.amount < 0
                      ? 'font-bold text-danger'
                      : idx === pnlData.length - 1
                      ? 'font-extrabold text-success text-base'
                      : 'font-bold text-primary'
                  }
                >
                  {formatCurrency(row.amount)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly Performance & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Revenue & Net Surplus</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartWrapper
              data={quarterlyComparison}
              xKey="quarter"
              bars={[
                { key: 'revenue', name: 'Gross Revenue (₹)', color: '#0F4C81' },
                { key: 'profit', name: 'Net Surplus (₹)', color: '#16A34A' },
              ]}
              height={260}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenditure Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChartWrapper data={expenseBreakdown} height={260} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
