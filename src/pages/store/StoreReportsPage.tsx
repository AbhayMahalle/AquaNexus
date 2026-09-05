import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  Calendar,
  FilterX,
  ArrowDownToLine,
  ArrowUpFromLine,
  Truck,
  RotateCcw,
  AlertOctagon,
  AlertTriangle,
  FileCheck2,
  Package,
  Clock,
  CheckCircle2
} from 'lucide-react';

export type ReportType =
  | 'inventory_ledger'
  | 'stock_in_summary'
  | 'stock_out_consumption'
  | 'goods_received_summary'
  | 'dispatch_summary'
  | 'returns_summary'
  | 'damage_writeoff_summary'
  | 'low_stock_summary';

export interface ReportRow {
  id: string;
  date: string;
  reference: string;
  categoryOrItem: string;
  quantity: string | number;
  unit: string;
  sourceOrDestination: string;
  officer: string;
  status: string;
  valuationImpact?: string;
}

export default function StoreReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('inventory_ledger');
  const [dateRange, setDateRange] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // API-ready state
  const reportRows: ReportRow[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

  const reportTypeOptions = [
    { label: '1. Inventory & Stock Valuation Ledger', value: 'inventory_ledger' },
    { label: '2. Stock IN / Procurement Inward Summary', value: 'stock_in_summary' },
    { label: '3. Stock OUT / Line Consumption Summary', value: 'stock_out_consumption' },
    { label: '4. Goods Received Notes (GRN) Summary', value: 'goods_received_summary' },
    { label: '5. Finished Water Dispatch Summary', value: 'dispatch_summary' },
    { label: '6. 20L Empty Jar & Customer Returns Summary', value: 'returns_summary' },
    { label: '7. Damaged Goods & Scrap Write-off Summary', value: 'damage_writeoff_summary' },
    { label: '8. Low Stock & Reorder Threshold Summary', value: 'low_stock_summary' },
  ];

  const dateRangeOptions = [
    { label: 'Today', value: 'today' },
    { label: 'This Week (Mon - Sun)', value: 'this_week' },
    { label: 'This Month (Current)', value: 'this_month' },
    { label: 'Previous Month', value: 'last_month' },
    { label: 'Current Financial Quarter (Q3)', value: 'this_quarter' },
    { label: 'Custom Date Range', value: 'custom' },
  ];

  const reportTitles: Record<ReportType, { title: string; desc: string; icon: React.ReactNode }> = {
    inventory_ledger: {
      title: 'Inventory & Stock Valuation Ledger',
      desc: 'Complete inventory ledger tracking opening balances, net movements, closing stocks, and material valuation.',
      icon: <Package className="w-5 h-5 text-[#0F4C81]" />,
    },
    stock_in_summary: {
      title: 'Stock IN / Inward Summary Report',
      desc: 'Consolidated summary of raw material receipts, vendor batches, and warehouse intakes.',
      icon: <ArrowDownToLine className="w-5 h-5 text-[#16A34A]" />,
    },
    stock_out_consumption: {
      title: 'Stock OUT / Line Consumption Report',
      desc: 'Material issuance to bottling production lines, filtration plants, and operational consumption audit.',
      icon: <ArrowUpFromLine className="w-5 h-5 text-[#1597D4]" />,
    },
    goods_received_summary: {
      title: 'Goods Received (GRN) Summary Report',
      desc: 'Quality inspection logs, accepted vs rejected shipment counts, and delivery challans.',
      icon: <FileCheck2 className="w-5 h-5 text-[#0F4C81]" />,
    },
    dispatch_summary: {
      title: 'Store Dispatch & Distribution Summary Report',
      desc: 'Finished water outbound manifests, distributor allocations, route loads, and gate exits.',
      icon: <Truck className="w-5 h-5 text-[#2563EB]" />,
    },
    returns_summary: {
      title: 'Empty Jar & Customer Returns Report',
      desc: 'Reusable 20L bottle reverse logistics, distributor deposit credits, and sanitation logs.',
      icon: <RotateCcw className="w-5 h-5 text-[#7C3AED]" />,
    },
    damage_writeoff_summary: {
      title: 'Damaged Goods & Scrap Write-off Report',
      desc: 'Loss audit statement detailing cracked jars, defective preforms, and scrap write-offs.',
      icon: <AlertOctagon className="w-5 h-5 text-[#DC2626]" />,
    },
    low_stock_summary: {
      title: 'Low Stock & Threshold Breach Summary Report',
      desc: 'History of critical shortage events, safety stock breaches, and requisition lead times.',
      icon: <AlertTriangle className="w-5 h-5 text-[#D97706]" />,
    },
  };

  const currentReportMeta = reportTitles[selectedReport] || reportTitles.inventory_ledger;

  const columns: Column<ReportRow>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{r.date}</span>
        </div>
      )
    },
    {
      key: 'reference',
      header: 'Reference Code',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.reference}</span>
    },
    {
      key: 'categoryOrItem',
      header: 'Item / Classification',
      render: (r) => <span className="font-bold text-[#172033]">{r.categoryOrItem}</span>
    },
    {
      key: 'quantity',
      header: 'Recorded Quantity',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantity} {r.unit}
        </span>
      )
    },
    {
      key: 'sourceOrDestination',
      header: 'Source / Destination',
      render: (r) => <span className="text-xs text-[#64748B]">{r.sourceOrDestination || '--'}</span>
    },
    {
      key: 'officer',
      header: 'Authorized By',
      render: (r) => <span className="text-xs text-[#172033] font-medium">{r.officer}</span>
    },
    {
      key: 'valuationImpact',
      header: 'Valuation Impact',
      render: (r) => <span className="font-mono text-xs text-[#64748B]">{r.valuationImpact || '--'}</span>
    },
    {
      key: 'status',
      header: 'Audit Status',
      render: (r) => <Badge variant="primary" size="sm">{r.status.toUpperCase()}</Badge>
    }
  ];

  const handleTriggerExport = (type: string) => {
    setExportNotice(`Export payload (${type.toUpperCase()}) queued for ${currentReportMeta.title}. Ready for backend generation.`);
    setTimeout(() => {
      setExportNotice(null);
    }, 3000);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDateRange('this_month');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'accountant', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Store & Inventory Reports"
          description="Analytical reporting engine for plant material stock levels, inward receipts, line issuances, and supply audit ledgers."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Reports' }
          ]}
          secondaryActions={[
            {
              label: 'Print Report',
              icon: <Printer className="w-4 h-4" />,
              onClick: () => window.print(),
              variant: 'outline',
            },
            {
              label: 'Export CSV',
              icon: <FileSpreadsheet className="w-4 h-4" />,
              onClick: () => handleTriggerExport('CSV'),
              variant: 'outline',
            }
          ]}
          primaryAction={{
            label: 'Download PDF Report',
            icon: <Download className="w-4 h-4" />,
            onClick: () => handleTriggerExport('PDF'),
          }}
        />

        {/* Export Notification Toast */}
        {exportNotice && (
          <div className="mb-6 p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#166534] flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Report Selector & Date Range Toolbar */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#0F4C81]" />
                <CardTitle className="text-base font-bold">Report Configuration & Date Filtering</CardTitle>
              </div>
              <Badge variant="primary" size="sm">
                8 Report Modules
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Select
                  label="Select Report Module"
                  value={selectedReport}
                  onChange={(e) => setSelectedReport(e.target.value as ReportType)}
                  options={reportTypeOptions}
                />
              </div>

              <div>
                <Select
                  label="Date Range Period"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  options={dateRangeOptions}
                />
              </div>
            </div>

            {dateRange === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#E2E8F0]">
                <Input
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-end pt-2 border-t border-[#E2E8F0]">
              <div className="flex-1 w-full">
                <Input
                  label="Search Within Report"
                  placeholder="Filter by Reference #, item name, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Calendar className="w-4 h-4" />}
                />
              </div>

              {(searchQuery || dateRange !== 'this_month') && (
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleResetFilters}
                  leftIcon={<FilterX className="w-4 h-4" />}
                  className="text-xs shrink-0"
                >
                  Reset Period
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected Report Summary KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card padding="sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Total Logged Entries
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#172033]">--</span>
              <span className="text-xs text-[#64748B]">Transactions</span>
            </div>
          </Card>

          <Card padding="sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Cumulative Volume
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#0F4C81]">--</span>
              <span className="text-xs text-[#64748B]">Units / Liters</span>
            </div>
          </Card>

          <Card padding="sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Reconciled Balance
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#16A34A]">--</span>
              <span className="text-xs text-[#64748B]">Verified</span>
            </div>
          </Card>

          <Card padding="sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Valuation Impact
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#172033]">--</span>
              <span className="text-xs text-[#64748B]">INR</span>
            </div>
          </Card>
        </div>

        {/* Report Output Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  {currentReportMeta.icon}
                  <span>{currentReportMeta.title}</span>
                </CardTitle>
                <CardDescription>
                  {currentReportMeta.desc}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="neutral" size="sm">
                  Filter: {dateRange.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={reportRows}
              loading={isLoading}
              emptyText="No report data generated for this period"
              emptyDescription="Historical ledger records will be queried and compiled from the reporting API based on your configured date range."
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={10}
                onPageChange={(p) => setCurrentPage(p)}
              />
            )}
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
