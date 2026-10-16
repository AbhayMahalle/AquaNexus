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

const FEATURE_MAP: Record<string, { label: string; desc: string }> = {
  PRODUCTION: { label: 'Production Management', desc: 'Batch logging, quality testing & output metrics' },
  INVENTORY: { label: 'Inventory & Stock Control', desc: 'Raw materials, stock levels & reorder alerts' },
  ORDERS: { label: 'Sales Orders & Invoicing', desc: 'Order tracking, GST invoices & dispatch' },
  DISTRIBUTION: { label: 'Distribution & Logistics', desc: 'Driver assignments, delivery routes & vehicle logs' },
  FINANCE: { label: 'Finance & Ledger', desc: 'Expense tracking, ledger accounts & revenue reports' },
  HR: { label: 'HR & Employee Management', desc: 'Staff shifts, attendance, payroll & roles' },
  P2P: { label: 'P2P Inter-Branch Transfer', desc: 'Plant-to-plant inventory & bottle exchanges' },
  ADVANCED_ANALYTICS: { label: 'Advanced Analytics', desc: 'Forecasting, cost efficiency & executive reports' },
};

const getFeatureInfo = (key: string) => {
  if (FEATURE_MAP[key]) return FEATURE_MAP[key];
  const formatted = key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return { label: formatted, desc: 'Included in plan tier' };
};

export default function AdminDashboardPage() {
  const [activeBatches, setActiveBatches] = useState<Production[]>([]);
  const [stats, setStats] = useState<any>({ totalQuantity: 0, completedBatches: 0, inProgressBatches: 0 });
  const [kpi, setKpi] = useState<any>({ production: 0, inventory: 0, employees: 0, pendingDispatches: 0, revenue: 0 });
  const [subscription, setSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [plansDropdownOpen, setPlansDropdownOpen] = useState(false);
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const plansDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (plansDropdownRef.current && !plansDropdownRef.current.contains(event.target as Node)) {
        setPlansDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setPlansDropdownOpen(false);
      }
    }
    if (plansDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [plansDropdownOpen]);

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

                          {/* Live Database Subscription Plans Dropdown */}
                          <div className="relative inline-block" ref={plansDropdownRef}>
                            <button
                              type="button"
                              onClick={() => setPlansDropdownOpen(!plansDropdownOpen)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer shadow-2xs ${
                                plansDropdownOpen
                                  ? 'bg-orange-600 text-white border-orange-600 ring-2 ring-orange-200'
                                  : 'bg-orange-50 text-orange-900 border-orange-200 hover:bg-orange-100 hover:border-orange-300'
                              }`}
                              title="View all subscription plans with prices & features fetched from database"
                            >
                              <Layers className="w-3.5 h-3.5 text-current" />
                              <span>View All Plans & Features ({availablePlans.length || 0})</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${plansDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Mobile backdrop */}
                            {plansDropdownOpen && (
                              <div
                                className="fixed inset-0 bg-black/40 z-40 sm:hidden"
                                onClick={() => setPlansDropdownOpen(false)}
                              />
                            )}

                            {/* Dropdown Menu Panel */}
                            {plansDropdownOpen && (
                              <div className="fixed inset-x-3 top-20 sm:absolute sm:inset-auto sm:left-0 sm:top-full sm:mt-2 z-50 w-auto sm:w-[580px] md:w-[680px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                                {/* Dropdown Header */}
                                <div className="p-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-between border-b border-gray-700">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-orange-500/20 text-orange-400 rounded-lg border border-orange-500/30">
                                      <Layers className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <h4 className="text-sm font-bold text-white">Subscription Plans Catalog</h4>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                          Live from Database
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-gray-300 mt-0.5">
                                        Current Plan: <span className="font-bold text-orange-400">{subscription.plan?.name || 'Basic'}</span> (₹{Number(subscription.plan?.price || 0).toLocaleString('en-IN')}/{subscription.plan?.billingCycle?.toLowerCase() === 'yearly' ? 'yr' : 'mo'})
                                      </p>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => setPlansDropdownOpen(false)}
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                    title="Close Dropdown"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Plan Filter Bar inside Dropdown */}
                                <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-2 flex-wrap">
                                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                    <span>Filter Plans:</span>
                                    <select
                                      value={selectedPlanFilter}
                                      onChange={(e) => setSelectedPlanFilter(e.target.value)}
                                      className="text-xs font-semibold bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-800 hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200 cursor-pointer shadow-2xs"
                                    >
                                      <option value="ALL">All Available Plans ({availablePlans.length})</option>
                                      {availablePlans.map((p: any) => (
                                        <option key={p.id} value={p.code}>
                                          {p.name} — ₹{Number(p.price).toLocaleString('en-IN')}/{p.billingCycle?.toLowerCase() === 'yearly' ? 'yr' : 'mo'} ({p.maxUsers} Users){p.code === subscription.plan?.code ? ' ★ Current' : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </label>

                                  <span className="text-[11px] text-gray-500">
                                    {availablePlans.length} plan{availablePlans.length !== 1 ? 's' : ''} configured
                                  </span>
                                </div>

                                {/* Plans List Container (Scrollable) */}
                                <div className="p-4 overflow-y-auto max-h-[58vh] space-y-3.5">
                                  {availablePlans.length === 0 ? (
                                    <div className="py-8 text-center text-gray-500 text-xs">
                                      Loading plans and features from database...
                                    </div>
                                  ) : (
                                    availablePlans
                                      .filter((plan: any) => selectedPlanFilter === 'ALL' || plan.code === selectedPlanFilter)
                                      .map((plan: any) => {
                                        const isCurrent = plan.code === subscription.plan?.code || plan.id === subscription.planId;
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
                                            className={`p-4 rounded-xl transition-all ${
                                              isCurrent
                                                ? 'border-2 border-emerald-500 bg-emerald-50/25 ring-2 ring-emerald-100 shadow-sm'
                                                : 'border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/10'
                                            }`}
                                          >
                                            {/* Plan Header */}
                                            <div className="flex items-start justify-between gap-3">
                                              <div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  <h5 className="text-base font-bold text-gray-950">{plan.name}</h5>
                                                  <Badge variant={plan.code === 'PRO_MAX' ? 'primary' : plan.code === 'PRO' ? 'success' : 'neutral'} className="font-bold text-[11px]">
                                                    {plan.code}
                                                  </Badge>
                                                  {isCurrent && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                                      <Check className="w-3.5 h-3.5 text-emerald-700" /> Current Plan
                                                    </span>
                                                  )}
                                                </div>
                                                {plan.description && (
                                                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">{plan.description}</p>
                                                )}
                                              </div>

                                              <div className="text-right shrink-0">
                                                <div className="text-lg font-black text-gray-950">
                                                  ₹{Number(plan.price).toLocaleString('en-IN')}
                                                  <span className="text-xs font-normal text-gray-500">
                                                    /{plan.billingCycle?.toLowerCase() === 'yearly' ? 'yr' : 'mo'}
                                                  </span>
                                                </div>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                                  {plan.billingCycle || 'Monthly'}
                                                </span>
                                              </div>
                                            </div>

                                            {/* Account Capacity Specs */}
                                            <div className="flex items-center gap-2 flex-wrap mt-2.5">
                                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200">
                                                <Users className="w-3.5 h-3.5 text-gray-600" />
                                                <span>Capacity: <strong>{plan.maxUsers}</strong> Business Account{plan.maxUsers > 1 ? 's' : ''}</span>
                                              </span>
                                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                                <span>Unlimited Plant Staff & Employees</span>
                                              </span>
                                            </div>

                                            {/* Features List from Database */}
                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3 text-orange-500" />
                                                Features Included ({featuresArray.length}):
                                              </p>

                                              {featuresArray.length > 0 ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                  {featuresArray.map((featKey: string) => {
                                                    const info = getFeatureInfo(featKey);
                                                    return (
                                                      <div
                                                        key={featKey}
                                                        className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200/70"
                                                      >
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                        <div className="min-w-0">
                                                          <p className="text-xs font-bold text-gray-900 leading-snug">{info.label}</p>
                                                          {info.desc && (
                                                            <p className="text-[10px] text-gray-500 leading-tight truncate">{info.desc}</p>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              ) : (
                                                <p className="text-xs text-gray-400 italic">Core water plant operational modules included</p>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })
                                  )}
                                </div>

                                {/* Dropdown Footer */}
                                <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-600">
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                    <Info className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                    <span>Plan upgrades and capacity expansions are managed by your Platform Super Admin.</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPlansDropdownOpen(false)}
                                    className="px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer shrink-0"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
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