'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { apiRequest, showToast } from '@/lib/api';
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
  rawDate?: Date | null;
  reference: string;
  categoryOrItem: string;
  quantity: string | number;
  rawQuantity?: number;
  unit: string;
  sourceOrDestination: string;
  officer: string;
  status: string;
  valuationImpact?: string;
  rawValuation?: number;
}

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('inventory_ledger');
  const [dateRange, setDateRange] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Live Backend Data State
  const [rawRows, setRawRows] = useState<ReportRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    { label: 'All Dates', value: 'all' },
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

  // Load Real Report Data from Existing Backend
  const loadReportData = useCallback(async () => {
    setIsLoading(true);
    setCurrentPage(1);
    try {
      if (selectedReport === 'inventory_ledger') {
        const res = await apiRequest<any>('/api/inventory?limit=100');
        if (res.ok && res.data) {
          const list = res.data.inventory || (Array.isArray(res.data) ? res.data : []);
          const mapped: ReportRow[] = list.map((inv: any) => {
            const qty = Number(inv.quantity) || 0;
            const price = Number(inv.product?.sellingPrice || inv.product?.unitPrice || 0);
            const val = qty * price;
            return {
              id: inv.id,
              date: inv.updatedAt ? new Date(inv.updatedAt).toLocaleDateString() : 'Current Balance',
              rawDate: inv.updatedAt ? new Date(inv.updatedAt) : null,
              reference: inv.product?.sku || 'SKU',
              categoryOrItem: inv.product?.name || 'Stock Item',
              quantity: qty,
              rawQuantity: qty,
              unit: inv.product?.unit || 'Units',
              sourceOrDestination: inv.product?.category || 'Central Warehouse',
              officer: 'Store Inventory',
              status: qty <= (inv.reorderLevel || 0) ? 'LOW STOCK' : 'IN STOCK',
              valuationImpact: price > 0 ? `₹${val.toLocaleString()}` : '--',
              rawValuation: val,
            };
          });
          setRawRows(mapped);
        }
      } else if (selectedReport === 'stock_in_summary') {
        const res = await apiRequest<any>('/api/stock-transactions?transactionType=STOCK_IN&limit=100');
        if (res.ok && res.data) {
          const list = res.data.transactions || (Array.isArray(res.data) ? res.data : []);
          const mapped: ReportRow[] = list.map((t: any) => {
            const qty = Number(t.quantity) || 0;
            const price = Number(t.product?.sellingPrice || 0);
            const val = qty * price;
            return {
              id: t.id,
              date: new Date(t.createdAt).toLocaleDateString(),
              rawDate: new Date(t.createdAt),
              reference: t.referenceId || `IN-${t.id.slice(0, 8)}`,
              categoryOrItem: t.product?.name || 'Inward Consignment',
              quantity: qty,
              rawQuantity: qty,
              unit: t.product?.unit || 'Units',
              sourceOrDestination: t.referenceType || 'Vendor / Delivery',
              officer: t.creator ? `${t.creator.firstName || ''} ${t.creator.lastName || ''}`.trim() : 'Store Staff',
              status: 'VERIFIED',
              valuationImpact: price > 0 ? `₹${val.toLocaleString()}` : '--',
              rawValuation: val,
            };
          });
          setRawRows(mapped);
        }
      } else if (selectedReport === 'stock_out_consumption') {
        const res = await apiRequest<any>('/api/stock-transactions?transactionType=STOCK_OUT&limit=100');
        if (res.ok && res.data) {
          const list = res.data.transactions || (Array.isArray(res.data) ? res.data : []);
          const mapped: ReportRow[] = list.map((t: any) => {
            const qty = Number(t.quantity) || 0;
            const price = Number(t.product?.sellingPrice || 0);
            const val = qty * price;
            return {
              id: t.id,
              date: new Date(t.createdAt).toLocaleDateString(),
              rawDate: new Date(t.createdAt),
              reference: t.referenceId || `OUT-${t.id.slice(0, 8)}`,
              categoryOrItem: t.product?.name || 'Issued Item',
              quantity: qty,
              rawQuantity: qty,
              unit: t.product?.unit || 'Units',
              sourceOrDestination: t.referenceType || 'Bottling Line',
              officer: t.creator ? `${t.creator.firstName || ''} ${t.creator.lastName || ''}`.trim() : 'Store Staff',
              status: 'ISSUED',
              valuationImpact: price > 0 ? `₹${val.toLocaleString()}` : '--',
              rawValuation: val,
            };
          });
          setRawRows(mapped);
        }
      } else if (selectedReport === 'goods_received_summary') {
        const res = await apiRequest<any>('/api/goods-received?limit=100');
        if (res.ok && res.data) {
          const list = res.data.goodsReceived || (Array.isArray(res.data) ? res.data : []);
          const mapped: ReportRow[] = list.map((gr: any) => {
            const qty = Number(gr.quantity) || 0;
            const price = Number(gr.product?.sellingPrice || 0);
            const val = qty * price;
            return {
              id: gr.id,
              date: new Date(gr.receivedDate || gr.createdAt).toLocaleDateString(),
              rawDate: new Date(gr.receivedDate || gr.createdAt),
              reference: gr.grnNumber || `GRN-${gr.id.slice(0, 8)}`,
              categoryOrItem: gr.product?.name || 'Produced Water Batch',
              quantity: qty,
              rawQuantity: qty,
              unit: gr.product?.unit || 'Units',
              sourceOrDestination: gr.production?.batchNumber || gr.production?.productionNumber || 'Production Batch',
              officer: gr.receiver ? `${gr.receiver.firstName || ''} ${gr.receiver.lastName || ''}`.trim() : 'Store QA',
              status: 'ACCEPTED',
              valuationImpact: price > 0 ? `₹${val.toLocaleString()}` : '--',
              rawValuation: val,
            };
          });
          setRawRows(mapped);
        }
      } else if (selectedReport === 'dispatch_summary') {
        const res = await apiRequest<any>('/api/dispatches?limit=100');
        if (res.ok && res.data) {
          const list = res.data.dispatches || (Array.isArray(res.data) ? res.data : []);
          const mapped: ReportRow[] = list.map((d: any) => {
            const totalQty = (d.dispatchItems || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
            const totalVal = (d.dispatchItems || []).reduce((sum: number, it: any) => sum + ((Number(it.quantity) || 0) * (Number(it.product?.sellingPrice) || 0)), 0);
            const itemNames = (d.dispatchItems || []).map((it: any) => it.product?.name).filter(Boolean).join(', ') || 'Finished Water';
            return {
              id: d.id,
              date: new Date(d.dispatchDate || d.createdAt).toLocaleDateString(),
              rawDate: new Date(d.dispatchDate || d.createdAt),
              reference: d.dispatchNumber || `DSP-${d.id.slice(0, 8)}`,
              categoryOrItem: itemNames,
              quantity: totalQty,
              rawQuantity: totalQty,
              unit: d.dispatchItems?.[0]?.product?.unit || 'Units',
              sourceOrDestination: d.distributor?.name || (d.vehicleNumber ? `Vehicle: ${d.vehicleNumber}` : 'Distributor Route'),
              officer: d.driverName || 'Dispatch Officer',
              status: (d.status || 'COMPLETED').toUpperCase(),
              valuationImpact: totalVal > 0 ? `₹${totalVal.toLocaleString()}` : '--',
              rawValuation: totalVal,
            };
          });
          setRawRows(mapped);
        }
      } else if (selectedReport === 'returns_summary') {
        const res = await apiRequest<any>('/api/returns');
        if (res.ok && res.data) {
          const list = res.data.returns || (Array.isArray(res.data) ? res.data : []);
          const mapped: ReportRow[] = list.map((r: any) => {
            const totalQty = (r.returnItems || []).reduce((sum: number, it: any) => sum + (Number(it.quantity) || 0), 0);
            const totalVal = (r.returnItems || []).reduce((sum: number, it: any) => sum + ((Number(it.quantity) || 0) * (Number(it.product?.sellingPrice) || 0)), 0);
            const itemNames = (r.returnItems || []).map((it: any) => it.product?.name).filter(Boolean).join(', ') || 'Returned Jars / Water';
            return {
              id: r.id,
              date: new Date(r.returnDate || r.createdAt).toLocaleDateString(),
              rawDate: new Date(r.returnDate || r.createdAt),
              reference: r.returnNumber || `RET-${r.id.slice(0, 8)}`,
              categoryOrItem: itemNames,
              quantity: totalQty,
              rawQuantity: totalQty,
              unit: r.returnItems?.[0]?.product?.unit || 'Bottle',
              sourceOrDestination: r.distributor?.name || 'Customer / Route',
              officer: r.creator ? `${r.creator.firstName || ''} ${r.creator.lastName || ''}`.trim() : 'Store Staff',
              status: (r.status || 'RESTOCKED').toUpperCase(),
              valuationImpact: totalVal > 0 ? `₹${totalVal.toLocaleString()}` : '--',
              rawValuation: totalVal,
            };
          });
          setRawRows(mapped);
        }
      } else if (selectedReport === 'damage_writeoff_summary') {
        const res = await apiRequest<any>('/api/stock-transactions?transactionType=DAMAGED&limit=100');
        if (res.ok && res.data) {
          const list = res.data.transactions || (Array.isArray(res.data) ? res.data : []);
          const mapped: ReportRow[] = list.map((t: any) => {
            const qty = Number(t.quantity) || 0;
            const price = Number(t.product?.sellingPrice || 0);
            const val = qty * price;
            return {
              id: t.id,
              date: new Date(t.createdAt).toLocaleDateString(),
              rawDate: new Date(t.createdAt),
              reference: t.referenceId || `DAM-${t.id.slice(0, 8)}`,
              categoryOrItem: t.product?.name || 'Damaged Material',
              quantity: qty,
              rawQuantity: qty,
              unit: t.product?.unit || 'Units',
              sourceOrDestination: t.referenceType || 'Quarantine / Scrap',
              officer: t.creator ? `${t.creator.firstName || ''} ${t.creator.lastName || ''}`.trim() : 'Store Inspector',
              status: 'WRITTEN OFF',
              valuationImpact: price > 0 ? `₹${val.toLocaleString()}` : '--',
              rawValuation: val,
            };
          });
          setRawRows(mapped);
        }
      } else if (selectedReport === 'low_stock_summary') {
        const res = await apiRequest<any>('/api/inventory/low-stock');
        if (res.ok && res.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          const mapped: ReportRow[] = list.map((item: any) => {
            const qty = Number(item.quantity) || 0;
            const price = Number(item.product?.sellingPrice || 0);
            const val = qty * price;
            const minStock = item.reorderLevel || item.product?.minimumStock || 0;
            return {
              id: item.id,
              date: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Current Threshold',
              rawDate: item.updatedAt ? new Date(item.updatedAt) : null,
              reference: item.product?.sku || 'SKU',
              categoryOrItem: item.product?.name || 'Low Stock Material',
              quantity: qty,
              rawQuantity: qty,
              unit: item.product?.unit || 'Units',
              sourceOrDestination: item.product?.category || 'Central Store',
              officer: 'Safety Threshold Monitor',
              status: qty <= minStock * 0.2 ? 'CRITICAL' : 'REORDER DUE',
              valuationImpact: price > 0 ? `₹${val.toLocaleString()}` : '--',
              rawValuation: val,
            };
          });
          setRawRows(mapped);
        }
      }
    } catch (err) {
      console.error('Failed to load store report data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedReport]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  // Combined Date & Search Filtering
  const filteredRows = useMemo(() => {
    const now = new Date();

    let filterStart: Date | null = null;
    let filterEnd: Date | null = null;

    if (dateRange === 'today') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (dateRange === 'this_week') {
      const day = now.getDay() || 7;
      filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (dateRange === 'this_month') {
      filterStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    } else if (dateRange === 'last_month') {
      filterStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    } else if (dateRange === 'this_quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      filterStart = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0);
      filterEnd = new Date(now.getFullYear(), quarterMonth + 3, 0, 23, 59, 59);
    } else if (dateRange === 'custom') {
      if (startDate) filterStart = new Date(`${startDate}T00:00:00`);
      if (endDate) filterEnd = new Date(`${endDate}T23:59:59`);
    }

    return rawRows.filter((row) => {
      // Date filter (applied if row has rawDate and dateRange is not 'all')
      if (row.rawDate && dateRange !== 'all') {
        const time = row.rawDate.getTime();
        if (filterStart && time < filterStart.getTime()) return false;
        if (filterEnd && time > filterEnd.getTime()) return false;
      }

      // Search text filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesRef = row.reference?.toLowerCase().includes(query);
        const matchesItem = row.categoryOrItem?.toLowerCase().includes(query);
        const matchesSource = row.sourceOrDestination?.toLowerCase().includes(query);
        const matchesOfficer = row.officer?.toLowerCase().includes(query);
        const matchesStatus = row.status?.toLowerCase().includes(query);

        if (!matchesRef && !matchesItem && !matchesSource && !matchesOfficer && !matchesStatus) {
          return false;
        }
      }

      return true;
    });
  }, [rawRows, dateRange, startDate, endDate, searchQuery]);

  // Derived KPI Calculations from Real Filtered Data
  const totalEntries = filteredRows.length;
  const totalVolume = filteredRows.reduce((sum, r) => sum + (Number(r.rawQuantity ?? r.quantity) || 0), 0);
  const reconciledCount = filteredRows.filter((r) => ['VERIFIED', 'ACCEPTED', 'COMPLETED', 'RESTOCKED', 'IN STOCK'].includes(r.status)).length;
  const totalValuation = filteredRows.reduce((sum, r) => sum + (Number(r.rawValuation) || 0), 0);

  // Pagination
  const itemsPerPage = 10;
  const totalItems = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

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
      render: (r) => {
        const isAlert = ['CRITICAL', 'LOW STOCK', 'WRITTEN OFF'].includes(r.status);
        return (
          <Badge variant={isAlert ? 'danger' : 'primary'} size="sm">
            {r.status.toUpperCase()}
          </Badge>
        );
      }
    }
  ];

  const handleExportCSV = () => {
    if (filteredRows.length === 0) {
      showToast('No report rows to export for this period', 'info');
      return;
    }

    const headers = ['Date', 'Reference Code', 'Item / Classification', 'Recorded Quantity', 'Unit', 'Source / Destination', 'Authorized By', 'Valuation Impact', 'Audit Status'];
    const rows = filteredRows.map((r) => [
      `"${r.date}"`,
      `"${r.reference}"`,
      `"${r.categoryOrItem.replace(/"/g, '""')}"`,
      `"${r.quantity}"`,
      `"${r.unit}"`,
      `"${(r.sourceOrDestination || '').replace(/"/g, '""')}"`,
      `"${(r.officer || '').replace(/"/g, '""')}"`,
      `"${r.valuationImpact || '--'}"`,
      `"${r.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedReport}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV report exported successfully!', 'success');
  };

  const handleTriggerExport = (type: string) => {
    if (type === 'CSV') {
      handleExportCSV();
    } else {
      window.print();
    }
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
                8 Live Modules
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
              <span className="text-2xl font-bold text-[#172033]">
                {isLoading ? '...' : totalEntries}
              </span>
              <span className="text-xs text-[#64748B]">Records</span>
            </div>
          </Card>

          <Card padding="sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Cumulative Volume
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#0F4C81]">
                {isLoading ? '...' : totalVolume.toLocaleString()}
              </span>
              <span className="text-xs text-[#64748B]">Units / Qty</span>
            </div>
          </Card>

          <Card padding="sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Reconciled Balance
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#16A34A]">
                {isLoading ? '...' : reconciledCount}
              </span>
              <span className="text-xs text-[#64748B]">Verified</span>
            </div>
          </Card>

          <Card padding="sm">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider block">
              Valuation Impact
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold text-[#172033]">
                {isLoading ? '...' : totalValuation > 0 ? `₹${totalValuation.toLocaleString()}` : '--'}
              </span>
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
              data={paginatedRows}
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
