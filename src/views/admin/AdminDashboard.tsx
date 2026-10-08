'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Factory,
  Package,
  TrendingUp,
  Users,
  AlertTriangle,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

import type { Production, Product } from '@/types';
import { productionService } from '@/services/productionService';
import { fetchApi } from '@/services/apiClient';

export default function AdminDashboardPage() {
  const [activeBatches, setActiveBatches] = useState<Production[]>([]);
  const [stats, setStats] = useState<any>({ totalQuantity: 0, completedBatches: 0, inProgressBatches: 0 });
  const [kpi, setKpi] = useState<any>({ production: 0, inventory: 0, employees: 0, pendingDispatches: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [batchesRes, statsRes, inventoryRes, employeesRes, ordersRes, dispatchRes] = await Promise.all([
        productionService.getProductionBatches({}),
        fetch('/api/production/stats', { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetchApi<any>('/inventory'),
        fetchApi<any>('/employees'),
        fetchApi<any>('/orders'),
        fetchApi<any>('/dispatches'),
      ]);

      if (batchesRes.success) {
        setActiveBatches(batchesRes.data.slice(0, 10));
      }
      if (statsRes.success) setStats(statsRes.data);

      // Calculate real KPIs
      const totalProduction = statsRes.success ? (statsRes.data?.totalQuantity || 0) : 0;
      const inventoryItems = inventoryRes.success ? (Array.isArray(inventoryRes.data) ? inventoryRes.data : (inventoryRes.data?.inventory || [])) : [];
      const totalStock = inventoryItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
      const employees = employeesRes.success ? (Array.isArray(employeesRes.data) ? employeesRes.data : (employeesRes.data?.employees || [])) : [];
      const activeEmployees = employees.filter((e: any) => e.status === 'ACTIVE').length;
      const totalEmployees = employees.length;
      const dispatches = dispatchRes.success ? (Array.isArray(dispatchRes.data) ? dispatchRes.data : (dispatchRes.data?.dispatches || [])) : [];
      const pendingDispatches = dispatches.filter((d: any) => d.status === 'PREPARING' || d.status === 'PENDING').length;

      const orders = ordersRes.success ? (Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.orders || [])) : [];
      const revenue = orders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);

      setKpi({ production: totalProduction, inventory: totalStock, activeEmployees, totalEmployees, pendingDispatches, revenue });
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };



  const productionColumns: Column<Production>[] = [
    {
      key: 'batchNumber',
      header: <span className="text-black font-bold">Batch No</span>,
      render: (r) => (
        <span className="font-mono font-bold text-orange-600 text-xs px-2 py-0.5 rounded bg-orange-50 border border-orange-200">
          {r.batchNumber}
        </span>
      ),
    },
    {
      key: 'productName',
      header: <span className="text-black font-bold">Product Item</span>,
      render: (r) => <span className="font-semibold text-black">{r.productName}</span>,
    },
    {
      key: 'quantityProduced',
      header: <span className="text-black font-bold">Quantity</span>,
      render: (r) => <span className="font-medium text-black">{`${formatNumber(r.quantityProduced)} ${r.unit}`}</span>,
    },
    {
      key: 'supervisor',
      header: <span className="text-black font-bold">Line manager</span>,
      render: (r) => <span className="text-gray-700 font-medium">{r.supervisor}</span>,
    },
    {
      key: 'productionDate',
      header: <span className="text-black font-bold">Date</span>,
      render: (r) => <span className="text-gray-600">{r.productionDate}</span>,
    },
    {
      key: 'status',
      header: <span className="text-black font-bold">Status</span>,
      render: (r) => {
        if (r.status === 'IN_PROGRESS') {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-950 border border-orange-300">
              IN PROGRESS
            </span>
          );
        }
        if (r.status === 'COMPLETED') {
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-black border border-gray-300">
              COMPLETED
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-50 text-gray-800 border border-gray-200">
            {r.status || 'PLANNED'}
          </span>
        );
      },
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin']}>
      <DashboardLayout theme="sample">
        <div className="text-black">
          <PageHeader
            title="Admin Control Center"
            description="Real-time plant metrics, production overview, and ERP operational status"
            breadcrumbs={[{ label: 'Admin Dashboard' }]}


          />

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-5 rounded-xl border border-gray-200 bg-white border-l-4 border-l-orange-500 shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Today&apos;s Production</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    {formatNumber(kpi.production || stats.totalQuantity || 0)} <span className="text-xs font-medium text-gray-600">Liters</span>
                  </h3>
                  <p className="text-xs text-orange-700 font-bold mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> {stats.completedBatches || 0} batches completed
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <Factory className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white border-l-4 border-l-black shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Finished Stock</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    {formatNumber(kpi.inventory || 0)} <span className="text-xs font-medium text-gray-600">Units</span>
                  </h3>
                  <p className="text-xs text-black font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-black" /> Stock level live
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 text-black border border-gray-300">
                  <Package className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white border-l-4 border-l-orange-600 shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Order Revenue</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">{formatCurrency(kpi.revenue || 0)}</h3>
                  <p className="text-xs text-orange-700 font-bold mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Live billing orders
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white border-l-4 border-l-gray-600 shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all duration-150 cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Active Staff</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">{kpi.activeEmployees || 0} / {kpi.totalEmployees || 0}</h3>
                  <p className="text-xs text-gray-700 font-medium mt-1">Active on duty</p>
                </div>
                <div className="p-3 rounded-xl bg-gray-100 text-gray-800 border border-gray-300">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-gray-200 rounded-xl bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                  <div>
                    <h3 className="text-base font-bold text-black tracking-tight">Active Production Batches</h3>
                    <p className="text-xs text-gray-700 mt-0.5">Live telemetry from plant filling lines</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-950 border border-orange-300">
                    <Clock className="w-3 h-3 text-orange-700" />
                    Realtime
                  </span>
                </div>
                <div className="p-0">
                  <Table columns={productionColumns} data={activeBatches} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-black">Raw Water Reserve</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-black border border-gray-300">
                      92% Capacity
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">Inflow steady at 120 LPM from Borewell #1 & #2</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-black">UV & RO Filtration</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-950 border border-orange-300">
                      Purity 38 PPM
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">Conductivity and pH within certified standards</p>
                </div>

                <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 hover:bg-gray-50/70 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-black">Dispatch Queue</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-gray-100 text-black border border-gray-300">
                      {kpi.pendingDispatches || 0} Pending
                    </span>
                  </div>
                  <p className="text-xs text-gray-700">Agency vehicle loading at Bay 1 & Bay 2</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl bg-white shadow-xs p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="text-base font-bold text-black">Plant Operational Alerts</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-orange-50/80 border border-orange-200 flex items-start gap-3 hover:bg-gray-100 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-orange-600 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-orange-950">RO Membrane Filter Cleaning</p>
                      <p className="text-[11px] text-gray-700 mt-0.5">Scheduled for Line 2 at 06:00 PM</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-100 border border-gray-300 flex items-start gap-3 hover:bg-gray-200 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-black mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-black">Raw Water Tank 3 Level Low</p>
                      <p className="text-[11px] text-gray-700 mt-0.5">Capacity at 18%. Borewell pump activated.</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 flex items-start gap-3 hover:bg-gray-100 transition-colors">
                    <span className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-black">Quality Lab Clearance Passed</p>
                      <p className="text-[11px] text-gray-700 mt-0.5">Batch BATCH-089 purity TDS: 42 ppm</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl bg-white shadow-xs p-5">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200 mb-4">
                  <ShieldCheck className="w-5 h-5 text-black" />
                  <h3 className="text-base font-bold text-black">Plant Security & Compliance</h3>
                </div>
                <div className="text-xs text-gray-700 space-y-2.5">
                  <p className="flex justify-between items-center">
                    <span>• ISO 22000 Water Safety:</span>
                    <strong className="text-black bg-gray-100 px-2 py-0.5 rounded border border-gray-200 font-bold">
                      Compliant
                    </strong>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>• BIS License Certification:</span>
                    <strong className="text-black font-bold">Active (CM/L-1234)</strong>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>• Daily Water Testing Log:</span>
                    <strong className="text-orange-700 font-bold">Verified</strong>
                  </p>
                  <p className="flex justify-between items-center">
                    <span>• Plant Health & Safety:</span>
                    <strong className="text-black font-bold">100% Passed</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>


        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}