'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { showToast, exportToCSV } from '@/lib/api';
import { fetchApi } from '@/services/apiClient';
import { Download, FileText, ExternalLink, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const [loading, setLoading] = useState<boolean>(true);
  const [productions, setProductions] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      const [prodRes, invRes, salesRes, attRes] = await Promise.all([
        fetchApi<any>('/production'),
        fetchApi<any>('/inventory'),
        fetchApi<any>('/sales').catch(() => ({ success: false, data: [] })),
        fetchApi<any>('/attendance').catch(() => ({ success: false, data: [] })),
      ]);

      if (prodRes.success && prodRes.data) {
        setProductions(prodRes.data.productions || (Array.isArray(prodRes.data) ? prodRes.data : []));
      }
      if (invRes.success && invRes.data) {
        setInventory(invRes.data.inventory || (Array.isArray(invRes.data) ? invRes.data : []));
      }
      if (salesRes.success && salesRes.data) {
        setSales(salesRes.data.sales || (Array.isArray(salesRes.data) ? salesRes.data : []));
      }
      if (attRes.success && attRes.data) {
        setAttendance(attRes.data.attendance || (Array.isArray(attRes.data) ? attRes.data : []));
      }
    } catch (err) {
      console.error('Failed to load operational reports data:', err);
      showToast('Failed to load live reports data from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const reports = [
    {
      id: 'prod-yield',
      title: 'Daily Production & Yield Report',
      desc: 'Live breakdown of bottled water production batches, output volume, and line status',
      date: 'Live Data',
      count: productions.length,
      data: productions.map((p) => ({
        batchNumber: p.batchNumber || p.productionNumber,
        product: p.product?.name || 'Water Product',
        quantity: p.quantity,
        date: p.productionDate ? new Date(p.productionDate).toLocaleDateString() : 'N/A',
        status: p.status,
      })),
      columns: [
        { key: 'batchNumber', header: 'Batch / Lot Number' },
        { key: 'product', header: 'Product Item' },
        { key: 'quantity', header: 'Units Produced' },
        { key: 'date', header: 'Production Date' },
        { key: 'status', header: 'Batch Status' },
      ],
    },
    {
      id: 'stock-ledger',
      title: 'Stock & Inventory Ledger',
      desc: 'Live warehouse stock balances, reserved quantities, and reorder alerts',
      date: 'Live Data',
      count: inventory.length,
      data: inventory.map((inv) => ({
        sku: inv.product?.sku || 'N/A',
        product: inv.product?.name || 'Water Product',
        category: inv.product?.category || 'Finished Goods',
        quantity: inv.quantity,
        reserved: inv.reservedQuantity || 0,
        reorderLevel: inv.reorderLevel || 0,
        status: inv.quantity <= inv.reorderLevel ? 'LOW STOCK' : 'HEALTHY',
      })),
      columns: [
        { key: 'sku', header: 'Product SKU' },
        { key: 'product', header: 'Item Name' },
        { key: 'category', header: 'Category' },
        { key: 'quantity', header: 'Current Stock' },
        { key: 'reserved', header: 'Reserved' },
        { key: 'reorderLevel', header: 'Reorder Level' },
        { key: 'status', header: 'Stock Status' },
      ],
    },
    {
      id: 'dist-sales',
      title: 'Distributor Sales Summary',
      desc: 'Live customer orders, distributor dispatches, billing amounts, and sales settlement',
      date: 'Live Data',
      count: sales.length,
      data: sales.map((s) => ({
        saleNumber: s.saleNumber,
        distributor: s.distributor?.name || 'Distributor Agency',
        date: s.saleDate ? new Date(s.saleDate).toLocaleDateString() : 'N/A',
        totalAmount: `₹${Number(s.totalAmount || 0).toLocaleString()}`,
        status: s.status,
      })),
      columns: [
        { key: 'saleNumber', header: 'Sale Number' },
        { key: 'distributor', header: 'Distributor Agency' },
        { key: 'date', header: 'Sale Date' },
        { key: 'totalAmount', header: 'Total Value' },
        { key: 'status', header: 'Status' },
      ],
    },
    {
      id: 'attendance-ot',
      title: 'Shift Attendance & Workforce Log',
      desc: 'Plant biometric check-in log, employee attendance state, and work hours',
      date: 'Live Data',
      count: attendance.length,
      data: attendance.map((att) => ({
        empCode: att.employee?.employeeCode || 'EMP-N/A',
        name: `${att.employee?.firstName || ''} ${att.employee?.lastName || ''}`.trim(),
        department: att.employee?.department?.name || 'Plant Operations',
        date: att.attendanceDate ? new Date(att.attendanceDate).toLocaleDateString() : 'N/A',
        status: att.status,
        checkIn: att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A',
      })),
      columns: [
        { key: 'empCode', header: 'Employee Code' },
        { key: 'name', header: 'Employee Name' },
        { key: 'department', header: 'Department' },
        { key: 'date', header: 'Attendance Date' },
        { key: 'status', header: 'Attendance State' },
        { key: 'checkIn', header: 'Check In Time' },
      ],
    },
  ];

  const handleDownload = (rep: (typeof reports)[0]) => {
    if (rep.data.length === 0) {
      showToast(`No records found in database for ${rep.title}`, 'info');
      return;
    }
    exportToCSV(rep.data as Record<string, any>[], rep.columns, rep.id);
    showToast(`Downloaded ${rep.title} CSV`, 'success');
  };

  const handleViewOnline = (rep: (typeof reports)[0]) => {
    showToast(`${rep.title}: ${rep.count} active record(s) loaded from database`, 'info');
  };

  return (
    <AuthGuard allowedRoles={['manager', 'admin', 'accountant', 'store_manager']}>
      <DashboardLayout>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <PageHeader
            title="Operational Reports & Analytics"
            description="Live exportable audit logs and records fetched directly from AquaNexus database"
            breadcrumbs={[{ label: 'Operations' }, { label: 'Reports' }]}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReportsData}
            disabled={loading}
            leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((rep, idx) => (
            <Card key={idx} variant="interactive">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0F4C81]" />
                  <span>{rep.title}</span>
                </CardTitle>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {loading ? 'Loading...' : `${rep.count} Record${rep.count === 1 ? '' : 's'}`}
                </span>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[#64748B] leading-relaxed">{rep.desc}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={() => handleDownload(rep)}
                    disabled={loading || rep.data.length === 0}
                  >
                    Download CSV
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                    onClick={() => handleViewOnline(rep)}
                    disabled={loading}
                  >
                    View Status
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