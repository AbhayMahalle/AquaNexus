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
import { Link } from 'react-router-dom';
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
  ShieldCheck,
  Trash2,
  Layers,
  ChevronDown,
  Check,
  Sparkles,
  X,
  Info
} from 'lucide-react';

import type { Production, Product } from '@/types';
import { productionService } from '@/services/productionService';
import { fetchApi } from '@/services/apiClient';

const FEATURE_LABELS: Record<string, string> = {
  PRODUCTION: 'Production & Batches',
  INVENTORY: 'Inventory & Stock',
  ORDERS: 'Orders & Invoices',
  DISTRIBUTION: 'Route Distribution',
  FINANCE: 'Finance & Ledger',
  HR: 'HR & Employees',
  P2P: 'Plant Transfer (P2P)',
  ADVANCED_ANALYTICS: 'Advanced Analytics',
};

const getFeatureLabel = (key: string) => {
  if (FEATURE_LABELS[key]) return FEATURE_LABELS[key];
  return key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

export default function AdminDashboardPage() {
  const [activeBatches, setActiveBatches] = useState<Production[]>([]);
  const [stats, setStats] = useState<any>({ totalQuantity: 0, completedBatches: 0, inProgressBatches: 0 });
  const [kpi, setKpi] = useState<any>({ production: 0, inventory: 0, employees: 0, pendingDispatches: 0, revenue: 0 });
  const [subscription, setSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [plansModalOpen, setPlansModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [batchesRes, statsRes, inventoryRes, employeesRes, ordersRes, dispatchRes, subRes] = await Promise.all([
        productionService.getProductionBatches({}),
        fetch('/api/production/stats', { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetchApi<any>('/inventory'),
        fetchApi<any>('/employees'),
        fetchApi<any>('/orders'),
        fetchApi<any>('/dispatches'),
        fetchApi<any>('/company/subscription'),
      ]);

      if (subRes.success && subRes.data) {
        setSubscription(subRes.data.subscription || subRes.data);
      }

      // Live plans fetched dynamically from DB
      let plans = subRes.success && Array.isArray(subRes.data?.availablePlans) ? subRes.data.availablePlans : [];
      if (!plans || plans.length === 0) {
        try {
          const plansRes = await fetchApi<any>('/company/plans');
          if (plansRes.success && Array.isArray(plansRes.data?.plans)) {
            plans = plansRes.data.plans;
          }
        } catch (err) {
          console.error('Failed to load plans from DB:', err);
        }
      }
      setAvailablePlans(plans);

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
            title="Admin Dashboard"
            breadcrumbs={[{ label: 'Admin Dashboard' }]}
          />

          {/* Company Subscription Status Widget */}
          {subscription && (() => {
            const roleBreakdown = subscription.roleBreakdown || [];
            const businessRoles = roleBreakdown.filter((r: any) => r.isBusinessRole);
            const totalBusinessCapacity = subscription.totalBusinessCapacity ?? (
              businessRoles.length > 0
                ? businessRoles.reduce((sum: number, r: any) => sum + (typeof r.maxLimit === 'number' ? r.maxLimit : 1), 0)
                : (subscription.maxUsers && subscription.maxUsers > 1 ? subscription.maxUsers : 5)
            );
            const businessUsage = subscription.businessUserCount ?? subscription.currentUsage ?? 0;
            const isOverLimit = Boolean(
              subscription.isOverLimit ||
              businessUsage > totalBusinessCapacity ||
              businessRoles.some((r: any) => r.isOverLimit || (typeof r.maxLimit === 'number' && r.currentUsage > r.maxLimit))
            );
            const excessCount = subscription.excessCount || Math.max(0, businessUsage - totalBusinessCapacity);
            const isFull = isOverLimit || subscription.isLimitReached || businessUsage >= totalBusinessCapacity;

            return (
              <>
                {/* Strict Over-Limit Warning Banner */}
                {isOverLimit && (
                  <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-lg border-2 border-red-500 animate-pulse-subtle">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="p-3 bg-white/20 rounded-xl text-yellow-300 shrink-0">
                          <AlertTriangle className="w-7 h-7" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-white text-red-700">
                              Action Required
                            </span>
                            <span className="text-xs font-bold text-red-100">Plan Downgraded / Limit Exceeded</span>
                          </div>
                          <h3 className="text-base sm:text-lg font-extrabold mt-1 text-white">
                            User Limit Exceeded: {businessUsage} Active Users (Plan Allowance: {totalBusinessCapacity})
                          </h3>
                          <p className="text-xs sm:text-sm text-red-100 mt-1 max-w-2xl leading-relaxed">
                            Your subscription plan was updated to <strong>{subscription.plan?.name || 'Current Plan'}</strong>. You currently have <strong className="text-white underline">{excessCount} extra dashboard user(s)</strong> over your plan quota. You must strictly delete or deactivate the extra user(s) in User Management before standard dashboard operations can proceed.
                            <span className="block mt-1 text-xs text-yellow-200 font-medium">
                              ✓ Plant Employees are unlimited and never count toward your plan limit.
                            </span>
                          </p>
                        </div>
                      </div>
                      <Link to="/admin/users" className="shrink-0">
                        <Button variant="secondary" className="bg-white text-red-700 hover:bg-red-50 font-bold shadow-md hover:shadow-lg transition-all border-0 w-full sm:w-auto">
                          <Trash2 className="w-4 h-4 mr-1.5 text-red-600" /> Go to Users & Delete Extra
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Subscription Status Card */}
                <div className={`mb-6 p-4 sm:p-5 rounded-xl border bg-white shadow-xs ${isOverLimit ? 'border-red-400 bg-red-50/20' : 'border-gray-200'}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border shrink-0 ${isOverLimit ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-black">{subscription.organizationName || 'Company'}</h4>
                          <Badge variant={subscription.plan?.code === 'PRO_MAX' ? 'primary' : subscription.plan?.code === 'PRO' ? 'success' : 'neutral'} className="font-bold">
                            {subscription.plan?.name || 'Basic Plan'}
                          </Badge>
                          <Badge variant={subscription.status === 'ACTIVE' ? 'success' : 'danger'}>
                            {subscription.status}
                          </Badge>
                          {isOverLimit && (
                            <Badge variant="danger" className="font-bold animate-pulse">
                              {excessCount} Users Over Quota
                            </Badge>
                          )}

                          <button
                            type="button"
                            onClick={() => setPlansModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-orange-700 hover:border-orange-300 hover:bg-orange-50 transition-all shadow-2xs cursor-pointer"
                          >
                            <Layers className="w-3.5 h-3.5 text-orange-600" />
                            <span>All Plans</span>
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Billing: <strong className="text-black">{subscription.plan?.billingCycle || 'Monthly'}</strong> • Staff Accounts: <strong className="text-black">{totalBusinessCapacity}</strong> allowed (1 Admin • Unlimited Employees).
                        </p>
                      </div>
                    </div>

                    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 p-2.5 sm:p-3 rounded-lg border ${isOverLimit ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="text-left sm:text-right">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Account Usage</p>
                        <p className={`text-sm font-extrabold mt-0.5 ${isOverLimit ? 'text-red-700' : 'text-black'}`}>
                          {businessUsage} <span className="text-xs font-normal text-gray-500">/ {totalBusinessCapacity} used</span>
                        </p>
                      </div>
                      <div className="w-full sm:w-36 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full ${isOverLimit ? 'bg-red-600' : isFull ? 'bg-danger' : 'bg-orange-500'}`}
                          style={{ width: `${Math.min(100, Math.round((businessUsage / Math.max(1, totalBusinessCapacity)) * 100))}%` }}
                        />
                      </div>
                      <div>
                        {isOverLimit ? (
                          <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> {excessCount} Extra
                          </span>
                        ) : isFull ? (
                          <span className="text-xs font-bold text-danger flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Quota Reached
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-success">
                            {Math.max(0, totalBusinessCapacity - businessUsage)} free
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Per-role entitlement pills */}
                  {roleBreakdown.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-3 mt-3 border-t border-gray-100 text-xs">
                      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mr-1">Role Quotas:</span>
                      <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-medium">
                        👑 Admin: <strong>1/1</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
                        ⚙️ Employees: <strong>Unlimited</strong> ({subscription.employeeCount ?? 0} active)
                      </span>
                      {businessRoles.map((r: any) => {
                        const roleOver = Boolean(r.isOverLimit || (typeof r.maxLimit === 'number' && r.currentUsage > r.maxLimit));
                        return (
                          <span
                            key={r.roleName}
                            className={`px-2 py-0.5 rounded border text-[11px] font-medium ${
                              roleOver
                                ? 'bg-red-100 border-red-300 text-red-900 font-bold'
                                : r.isLimitReached
                                ? 'bg-amber-50 border-amber-200 text-amber-900 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-700'
                            }`}
                          >
                            {r.roleName}: <strong>{r.currentUsage}/{r.maxLimit}</strong>
                            {roleOver && <span className="ml-1 text-red-700">({r.currentUsage - r.maxLimit} extra)</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* All Plans Popup Modal — Clean & Minimal */}
                <Modal
                  isOpen={plansModalOpen}
                  onClose={() => setPlansModalOpen(false)}
                  title="Subscription Plans"
                  subtitle="Available platform tiers and authorized capacities"
                  size="xl"
                  footer={
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-gray-500">
                        Contact your Super Admin to upgrade or modify plan assignments.
                      </span>
                      <Button variant="outline" size="sm" onClick={() => setPlansModalOpen(false)}>
                        Close
                      </Button>
                    </div>
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                    {availablePlans.map((plan: any) => {
                      const isCurrent = plan.code === subscription?.plan?.code || plan.id === subscription?.planId;
                      let featuresArray: string[] = [];
                      if (Array.isArray(plan.features)) {
                        featuresArray = plan.features;
                      } else if (typeof plan.features === 'string') {
                        try {
                          featuresArray = JSON.parse(plan.features);
                        } catch {
                          featuresArray = [];
                        }
                      }

                      return (
                        <div
                          key={plan.id}
                          className={`rounded-xl p-4 flex flex-col justify-between transition-all ${
                            isCurrent
                              ? 'border-2 border-emerald-500 bg-emerald-50/25 ring-2 ring-emerald-100 shadow-xs'
                              : 'border border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div>
                            {/* Header: Name & Badge */}
                            <div className="flex items-center justify-between gap-1 mb-2">
                              <h4 className="text-base font-bold text-gray-950">{plan.name}</h4>
                              {isCurrent ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  Current
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                  {plan.code}
                                </span>
                              )}
                            </div>

                            {/* Price */}
                            <div className="mb-3">
                              <span className="text-2xl font-black text-gray-950">
                                ₹{Number(plan.price).toLocaleString('en-IN')}
                              </span>
                              <span className="text-xs text-gray-500 font-medium">/{plan.billingCycle?.toLowerCase() === 'yearly' ? 'yr' : 'mo'}</span>
                            </div>

                            {/* Capacity */}
                            <div className="text-xs font-semibold text-gray-800 pb-3 mb-3 border-b border-gray-100 space-y-1">
                              <p className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-gray-500" />
                                <span><strong>{plan.maxUsers}</strong> Business Account{plan.maxUsers > 1 ? 's' : ''}</span>
                              </p>
                              <p className="text-[11px] text-emerald-700 font-medium pl-5">
                                ✓ Unlimited Plant Staff
                              </p>
                            </div>

                            {/* Minimal Features List */}
                            <div className="space-y-1.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                                Features
                              </p>
                              {featuresArray.length > 0 ? (
                                featuresArray.map((featKey: string) => (
                                  <div key={featKey} className="flex items-center gap-1.5 text-xs text-gray-700">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="truncate">{getFeatureLabel(featKey)}</span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-400 italic">Core Operations</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Modal>
              </>
            );
          })()}

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