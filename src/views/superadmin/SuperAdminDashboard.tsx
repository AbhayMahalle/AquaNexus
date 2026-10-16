'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, Column } from '@/components/ui/Table';
import { apiRequest, showToast } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  Building2,
  Users,
  CreditCard,
  Layers,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Plus,
  ArrowRight,
  Settings,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, companiesRes] = await Promise.all([
        apiRequest<any>('/platform/stats'),
        apiRequest<any>('/platform/companies'),
      ]);

      if (statsRes.ok && statsRes.data) {
        setStats(statsRes.data);
      }
      if (companiesRes.ok && companiesRes.data) {
        const raw = companiesRes.data.organizations || companiesRes.data || [];
        const sorted = Array.isArray(raw) ? [...raw].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) : [];
        setCompanies(sorted.slice(0, 5));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load platform statistics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const companyColumns: Column<any>[] = [
    {
      key: 'name',
      header: 'Company Name',
      render: (c) => (
        <div>
          <span className="font-bold text-black">{c.name}</span>
          <span className="block text-xs font-mono text-gray-400">/{c.slug}</span>
        </div>
      ),
    },
    {
      key: 'subscription',
      header: 'Subscription Plan',
      render: (c) => {
        const sub = c.subscription;
        if (!sub) return <Badge variant="neutral">NO PLAN</Badge>;
        const code = sub.planCode || sub.planName;
        return (
          <div className="flex items-center gap-1.5">
            <Badge
              variant={code === 'PRO_MAX' ? 'primary' : code === 'PRO' ? 'success' : 'neutral'}
              className="font-bold text-xs"
            >
              {sub.planName || 'Basic'}
            </Badge>
            <span className="text-xs text-gray-500">({sub.maxUsers} max users)</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge variant={c.status === 'ACTIVE' ? 'success' : 'danger'}>
          {c.status}
        </Badge>
      ),
    },
    {
      key: 'users',
      header: 'Active Staff',
      render: (c) => (
        <span className="font-bold text-gray-700">
          {c.stats?.userCount ?? c._count?.users ?? 0}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Onboarded Date',
      render: (c) => (
        <span className="text-xs text-gray-500">
          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
        </span>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['super_admin']}>
      <DashboardLayout>
        <div className="text-black">
          <PageHeader
            title="Platform Overview"
            breadcrumbs={[{ label: 'Platform Overview' }]}
            primaryAction={{
              label: 'Add Company',
              icon: <Plus className="w-4 h-4" />,
              onClick: () => navigate('/super-admin/companies'),
              variant: 'primary',
            }}
            secondaryActions={[
              {
                label: 'Plans',
                icon: <Layers className="w-4 h-4" />,
                variant: 'outline',
                onClick: () => navigate('/super-admin/plans'),
              },
              {
                label: 'Subscriptions',
                icon: <CreditCard className="w-4 h-4" />,
                variant: 'outline',
                onClick: () => navigate('/super-admin/subscriptions'),
              },
            ]}
          />

          {/* Platform KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              onClick={() => navigate('/super-admin/companies')}
              className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 cursor-pointer transition-all border-l-4 border-l-orange-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Companies</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    {stats?.companies?.total ?? stats?.metrics?.totalCompanies ?? companies.length}
                  </h3>
                  <p className="text-xs text-success font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {stats?.companies?.active ?? stats?.metrics?.activeCompanies ?? companies.filter(c => c.status === 'ACTIVE').length} Active Companies
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <Building2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/super-admin/subscriptions')}
              className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 cursor-pointer transition-all border-l-4 border-l-blue-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Subscriptions</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    {stats?.subscriptions?.total ?? 0}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-gray-600">
                    {Object.entries(stats?.subscriptions?.breakdown || {}).map(([code, count]: [string, any], idx) => (
                      <React.Fragment key={code}>
                        {idx > 0 && <span>•</span>}
                        <span className="font-semibold text-gray-800">
                          {code}: <span className="font-bold text-blue-600">{count}</span>
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                  <Layers className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/super-admin/payments')}
              className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 cursor-pointer transition-all border-l-4 border-l-green-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    {formatCurrency(stats?.financials?.totalRevenue ?? stats?.metrics?.totalRevenue ?? 0)}
                  </h3>
                  <p className="text-xs text-gray-600 font-medium mt-1">
                    MRR: <span className="font-bold text-black">{formatCurrency(stats?.financials?.mrr ?? 0)}</span> • {stats?.financials?.totalTransactions ?? 0} Transactions
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-50 text-green-600 border border-green-200">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    {stats?.metrics?.totalUsers ?? stats?.totalUsers ?? 0}
                  </h3>
                  <p className="text-xs text-purple-700 font-semibold mt-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Across all companies
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Companies & Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-600" />
                  <span>Recently Onboarded Companies</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/super-admin/companies')}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  View All Companies
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table
                  columns={companyColumns}
                  data={companies}
                  emptyText="No customer companies registered yet"
                  emptyDescription="Click 'Add Company' to register the first company"
                />
              </CardContent>
            </Card>

            <div>
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Plan Overview</span>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-blue-600 p-0 h-auto"
                    onClick={() => navigate('/super-admin/plans')}
                  >
                    Edit Plans
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  {stats?.plans && stats.plans.length > 0 ? (
                    stats.plans.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        <div className="flex items-center justify-between font-bold text-black">
                          <div className="flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <span className="text-[10px] font-mono bg-gray-200 text-gray-700 px-1 rounded">{p.code}</span>
                          </div>
                          <span className="text-gray-900 font-extrabold">
                            {formatCurrency(p.price)} <span className="text-[10px] font-normal text-gray-500">/{p.billingCycle.toLowerCase()}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-500 mt-1.5">
                          <span>Capacity: up to {p.maxUsers} accounts</span>
                          <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[11px]">
                            {p.subscriberCount} active {p.subscriberCount === 1 ? 'company' : 'companies'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 italic">No plans configured</div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/super-admin/plans')}
                    className="mt-2"
                  >
                    Configure Pricing & Plans
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
