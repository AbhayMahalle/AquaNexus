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
        setCompanies(Array.isArray(raw) ? raw.slice(0, 5) : []);
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
            title="Aazira Solution — Platform Command Center"
            description="Multi-Tenant SaaS governance, company onboarding, subscription management & platform analytics"
            breadcrumbs={[{ label: 'Platform Owner' }, { label: 'Super Admin Dashboard' }]}
            primaryAction={{
              label: 'Onboard New Company',
              icon: <Plus className="w-4 h-4" />,
              onClick: () => navigate('/super-admin/companies'),
            }}
            secondaryActions={[
              {
                label: 'Manage Plans',
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

          {/* Platform Owner KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              onClick={() => navigate('/super-admin/companies')}
              className="p-5 rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-400 cursor-pointer transition-all border-l-4 border-l-orange-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Companies</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    {stats?.companies?.total ?? companies.length}
                  </h3>
                  <p className="text-xs text-success font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {stats?.companies?.active ?? companies.filter(c => c.status === 'ACTIVE').length} Active Tenants
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
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-gray-500">
                    <span className="font-semibold text-gray-700">Basic: {stats?.subscriptions?.breakdown?.BASIC ?? 0}</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-700">Pro: {stats?.subscriptions?.breakdown?.PRO ?? 0}</span>
                    <span>•</span>
                    <span className="font-semibold text-gray-700">Max: {stats?.subscriptions?.breakdown?.PRO_MAX ?? 0}</span>
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
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total SaaS Revenue</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">
                    {formatCurrency(stats?.financials?.totalRevenue ?? 0)}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {stats?.financials?.totalTransactions ?? 0} Transactions recorded
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
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Platform Governance</p>
                  <h3 className="text-2xl font-extrabold text-black mt-1">Aazira Solution</h3>
                  <p className="text-xs text-purple-700 font-semibold mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Singleton Super Admin
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick SaaS Management Sections */}
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
              <CardContent className="p-0">
                <Table
                  columns={companyColumns}
                  data={companies}
                  emptyText="No customer companies registered yet"
                  emptyDescription="Click 'Onboard New Company' to provision the first customer tenant"
                />
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Plan Entitlements Guide</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between font-bold text-black">
                      <span>Basic Plan</span>
                      <span className="text-gray-600">₹999 / mo</span>
                    </div>
                    <p className="text-gray-500 mt-0.5">Strictly 1 authorized operational account.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-green-50/50 border border-green-200">
                    <div className="flex items-center justify-between font-bold text-green-900">
                      <span>Pro Plan</span>
                      <span className="text-green-700">₹2,999 / mo</span>
                    </div>
                    <p className="text-green-700 mt-0.5">Up to 5 authorized operational accounts.</p>
                  </div>

                  <div className="p-3 rounded-lg bg-orange-50/50 border border-orange-200">
                    <div className="flex items-center justify-between font-bold text-orange-900">
                      <span>Pro Max Plan</span>
                      <span className="text-orange-700">Custom Pricing</span>
                    </div>
                    <p className="text-orange-700 mt-0.5">Tailored limits, duration, and enterprise features.</p>
                  </div>

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

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-purple-600" />
                    <span>Platform Admin Quick Links</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="justify-start"
                    onClick={() => navigate('/super-admin/subscriptions')}
                  >
                    Manage Company Subscriptions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="justify-start"
                    onClick={() => navigate('/super-admin/settings')}
                  >
                    Configure Platform Settings
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="justify-start"
                    onClick={() => navigate('/super-admin/profile')}
                  >
                    Super Admin Profile & Security
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
