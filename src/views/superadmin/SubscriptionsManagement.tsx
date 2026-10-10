'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiRequest, showToast } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import {
  CreditCard,
  Layers,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Clock,
  Search,
  Filter,
} from 'lucide-react';

export default function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Assign/Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subsRes, plansRes, compsRes] = await Promise.all([
        apiRequest<any>('/platform/subscriptions'),
        apiRequest<any>('/platform/plans'),
        apiRequest<any>('/platform/companies'),
      ]);

      if (subsRes.ok && subsRes.data) {
        setSubscriptions(subsRes.data.subscriptions || []);
      }
      if (plansRes.ok && plansRes.data) {
        setPlans(plansRes.data.plans || []);
      }
      if (compsRes.ok && compsRes.data) {
        setCompanies(compsRes.data.organizations || compsRes.data || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load subscriptions', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [formData, setFormData] = useState({
    companyId: '',
    planCode: 'BASIC',
    maxUsers: 1,
    roleLimits: {
      MANAGER: 10,
      STORE_MANAGER: 5,
      ACCOUNTANT: 5,
      DISTRIBUTOR: 10,
      SUPPLIER: 10,
    } as Record<string, number>,
    customPrice: '',
    billingCycle: 'MONTHLY',
    durationDays: 30,
    status: 'ACTIVE',
    notes: '',
  });

  const openAssignModal = (sub?: any) => {
    if (sub) {
      setSelectedSub(sub);
      const existingLimits = sub.roleLimits || sub.plan?.roleLimits || {};
      setFormData({
        companyId: sub.companyId,
        planCode: sub.plan?.code || 'BASIC',
        maxUsers: sub.maxUsers || 1,
        roleLimits: {
          MANAGER: existingLimits.MANAGER ?? 10,
          STORE_MANAGER: existingLimits.STORE_MANAGER ?? 5,
          ACCOUNTANT: existingLimits.ACCOUNTANT ?? 5,
          DISTRIBUTOR: existingLimits.DISTRIBUTOR ?? 10,
          SUPPLIER: existingLimits.SUPPLIER ?? 10,
        },
        customPrice: sub.plan?.price ? String(sub.plan.price) : '',
        billingCycle: sub.plan?.billingCycle || 'MONTHLY',
        durationDays: 30,
        status: sub.status || 'ACTIVE',
        notes: '',
      });
    } else {
      setSelectedSub(null);
      setFormData({
        companyId: companies[0]?.id || '',
        planCode: 'BASIC',
        maxUsers: 1,
        roleLimits: {
          MANAGER: 10,
          STORE_MANAGER: 5,
          ACCOUNTANT: 5,
          DISTRIBUTOR: 10,
          SUPPLIER: 10,
        },
        customPrice: '999',
        billingCycle: 'MONTHLY',
        durationDays: 30,
        status: 'ACTIVE',
        notes: '',
      });
    }
    setIsModalOpen(true);
  };

  const handlePlanSelectChange = (code: string) => {
    const sel = plans.find((p) => p.code === code);
    setFormData((prev) => ({
      ...prev,
      planCode: code,
      maxUsers: sel ? sel.maxUsers : prev.maxUsers,
      customPrice: sel ? String(sel.price) : prev.customPrice,
      billingCycle: sel ? sel.billingCycle : prev.billingCycle,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        companyId: formData.companyId,
        planCode: formData.planCode,
        maxUsers: parseInt(String(formData.maxUsers), 10),
        customPrice: formData.customPrice ? Number(formData.customPrice) : undefined,
        billingCycle: formData.billingCycle,
        durationDays: parseInt(String(formData.durationDays), 10),
        notes: formData.notes,
      };

      if (formData.planCode === 'PRO_MAX') {
        payload.roleLimits = formData.roleLimits;
      }

      const res = await apiRequest('/platform/subscriptions/assign', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Subscription plan successfully configured and assigned', 'success');
        setIsModalOpen(false);
        fetchData();
      } else {
        showToast(res.error || 'Failed to assign plan', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error assigning subscription', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (subId: string, targetStatus: string) => {
    try {
      const res = await apiRequest(`/platform/subscriptions/${subId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: targetStatus }),
      });
      if (res.ok) {
        showToast(`Subscription status changed to ${targetStatus}`, 'success');
        fetchData();
      } else {
        showToast(res.error || 'Failed to update status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    }
  };

  const filteredSubs = subscriptions.filter((s) => {
    const matchSearch =
      (s.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.companySlug || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.plan?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const columns: Column<any>[] = [
    {
      key: 'company',
      header: 'Company / Tenant',
      render: (s) => (
        <div>
          <span className="font-bold text-black">{s.companyName}</span>
          <span className="block text-xs font-mono text-gray-500">/{s.companySlug}</span>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Assigned Plan',
      render: (s) => (
        <div>
          <Badge
            variant={s.plan?.code === 'PRO_MAX' ? 'primary' : s.plan?.code === 'PRO' ? 'success' : 'neutral'}
            className="font-bold text-xs"
          >
            {s.plan?.name || 'Basic Plan'}
          </Badge>
          <span className="block text-xs text-gray-500 mt-0.5">
            {formatCurrency(s.plan?.price || 0)} / {s.plan?.billingCycle?.toLowerCase() || 'mo'}
          </span>
        </div>
      ),
    },
    {
      key: 'maxUsers',
      header: 'Staff Capacity & Roles',
      render: (s) => (
        <div>
          {s.plan?.code === 'BASIC' ? (
            <div>
              <span className="font-bold text-gray-900 text-xs">1 / business role</span>
              <span className="block text-[11px] text-gray-500">1 Admin • Unlimited Employees</span>
            </div>
          ) : s.plan?.code === 'PRO' ? (
            <div>
              <span className="font-bold text-gray-900 text-xs">5 / business role</span>
              <span className="block text-[11px] text-gray-500">1 Admin • Unlimited Employees</span>
            </div>
          ) : (
            <div>
              <span className="font-bold text-indigo-900 text-xs">Custom per-role limits</span>
              <span className="block text-[11px] text-indigo-600 font-mono">
                {s.roleLimits ? Object.entries(s.roleLimits).map(([k, v]) => `${k}:${v}`).join(', ') : 'Configurable'}
              </span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => {
        let variant: 'success' | 'danger' | 'warning' | 'neutral' = 'neutral';
        if (s.status === 'ACTIVE') variant = 'success';
        else if (s.status === 'SUSPENDED') variant = 'danger';
        else if (s.status === 'TRIAL') variant = 'warning';
        return <Badge variant={variant}>{s.status}</Badge>;
      },
    },
    {
      key: 'dates',
      header: 'Validity Period',
      render: (s) => (
        <div className="text-xs text-gray-600">
          <span>{s.startDate ? new Date(s.startDate).toLocaleDateString() : '—'}</span>
          <span className="text-gray-400"> → </span>
          <span>{s.endDate ? new Date(s.endDate).toLocaleDateString() : 'Continuous'}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openAssignModal(s)}
            title="Configure Plan & Limits"
          >
            <Edit className="w-3.5 h-3.5 mr-1" /> Configure
          </Button>
          {s.status === 'ACTIVE' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(s.id, 'SUSPENDED')}
              className="text-danger border-danger/30 hover:bg-danger/10"
              title="Suspend Subscription"
            >
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(s.id, 'ACTIVE')}
              className="text-success border-success/30 hover:bg-success/10"
              title="Activate Subscription"
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['super_admin']}>
      <DashboardLayout>
        <div className="text-black">
          <PageHeader
            title="SaaS Subscriptions & Tenant Entitlements"
            description="Manage company subscription statuses, user limits, renewal dates, and commercial terms"
            breadcrumbs={[{ label: 'Platform' }, { label: 'Subscriptions' }]}
            primaryAction={{
              label: 'Assign / Change Plan',
              icon: <Layers className="w-4 h-4" />,
              onClick: () => openAssignModal(),
            }}
          />

          <Card className="mb-6">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Active Customer Subscriptions ({filteredSubs.length})</span>
              </CardTitle>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-60">
                  <Input
                    placeholder="Search company or plan..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { label: 'All Statuses', value: '' },
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Suspended', value: 'SUSPENDED' },
                    { label: 'Expired', value: 'EXPIRED' },
                    { label: 'Trial', value: 'TRIAL' },
                  ]}
                  className="!w-36"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={columns}
                data={filteredSubs}
                emptyText="No subscriptions found"
                emptyDescription="Assign a subscription plan to customer companies to activate service"
              />
            </CardContent>
          </Card>

          {/* Assign / Change Plan Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={selectedSub ? `Configure Subscription: ${selectedSub.companyName}` : 'Assign Subscription Plan'}
            description="Super Admin platform configuration for company plan, pricing, and role creation limits"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
                  Save Subscription
                </Button>
              </>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {!selectedSub && (
                <Select
                  label="Target Company"
                  required
                  value={formData.companyId}
                  onChange={(e) => setFormData((f) => ({ ...f, companyId: e.target.value }))}
                  options={companies.map((c) => ({ label: `${c.name} (${c.slug})`, value: c.id }))}
                />
              )}

              <Select
                label="Subscription Plan Tier"
                required
                value={formData.planCode}
                onChange={(e) => handlePlanSelectChange(e.target.value)}
                options={[
                  { label: 'Basic Plan (1 User Limit • ₹999/mo)', value: 'BASIC' },
                  { label: 'Pro Plan (Up to 5 Users • ₹2,999/mo)', value: 'PRO' },
                  { label: 'Pro Max Plan (Configurable Limit & Custom Pricing)', value: 'PRO_MAX' },
                ]}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Allowed Staff/Role Limit"
                  type="number"
                  required
                  value={formData.maxUsers}
                  onChange={(e) => setFormData((f) => ({ ...f, maxUsers: parseInt(e.target.value, 10) || 1 }))}
                  helperText={
                    formData.planCode === 'BASIC'
                      ? 'Basic plan: 1 user per business role'
                      : formData.planCode === 'PRO'
                        ? 'Pro plan: 5 users per business role'
                        : 'Pro Max: fully configurable per role'
                  }
                />

                <Input
                  label="Custom Commercial Price (₹)"
                  type="number"
                  value={formData.customPrice}
                  onChange={(e) => setFormData((f) => ({ ...f, customPrice: e.target.value }))}
                  placeholder="e.g. 9999"
                  helperText="Leave blank to use default plan pricing"
                />
              </div>

              {formData.planCode === 'PRO_MAX' && (
                <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                      Pro Max Custom Role Limits (Configured Independently)
                    </span>
                    <span className="text-[11px] text-indigo-600 font-medium">
                      Admin: 1 • Employees: Unlimited
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { key: 'MANAGER', label: 'Operations Manager' },
                      { key: 'STORE_MANAGER', label: 'Store Manager' },
                      { key: 'ACCOUNTANT', label: 'Accountant' },
                      { key: 'DISTRIBUTOR', label: 'Distributor' },
                      { key: 'SUPPLIER', label: 'Vendor / Supplier' },
                    ].map((r) => (
                      <Input
                        key={r.key}
                        label={`${r.label} Limit`}
                        type="number"
                        value={formData.roleLimits[r.key] ?? 10}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                          setFormData((f) => ({
                            ...f,
                            roleLimits: { ...f.roleLimits, [r.key]: val },
                          }));
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Billing Cycle"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData((f) => ({ ...f, billingCycle: e.target.value }))}
                  options={[
                    { label: 'Monthly', value: 'MONTHLY' },
                    { label: 'Quarterly', value: 'QUARTERLY' },
                    { label: 'Annual', value: 'ANNUAL' },
                    { label: 'Custom', value: 'CUSTOM' },
                  ]}
                />

                <Input
                  label="Subscription Duration (Days)"
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData((f) => ({ ...f, durationDays: parseInt(e.target.value, 10) || 30 }))}
                />
              </div>

              <Input
                label="Internal Commercial Notes"
                value={formData.notes}
                onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Contract signed for Q4; negotiated custom enterprise tier"
              />
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
