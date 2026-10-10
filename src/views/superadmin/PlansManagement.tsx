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
  Layers,
  Plus,
  Edit,
  CheckCircle2,
  Shield,
  Zap,
} from 'lucide-react';

export default function PlansManagement() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 999,
    billingCycle: 'MONTHLY',
    maxUsers: 1,
    isCustom: false,
    isActive: true,
  });

  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/platform/plans');
      if (res.ok && res.data) {
        setPlans(res.data.plans || []);
      } else {
        showToast(res.error || 'Failed to load plans', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching plans', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedPlan(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      price: 999,
      billingCycle: 'MONTHLY',
      maxUsers: 1,
      isCustom: true,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (plan: any) => {
    setIsEditing(true);
    setSelectedPlan(plan);
    setFormData({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      price: plan.price,
      billingCycle: plan.billingCycle,
      maxUsers: plan.maxUsers,
      isCustom: plan.isCustom,
      isActive: plan.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = isEditing ? `/platform/plans/${selectedPlan.id}` : '/platform/plans';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await apiRequest(endpoint, {
        method,
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        showToast(isEditing ? 'Plan updated successfully' : 'Plan created successfully', 'success');
        setIsModalOpen(false);
        fetchPlans();
      } else {
        showToast(res.error || 'Failed to save plan', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving plan', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'name',
      header: 'Plan Tier',
      render: (p) => (
        <div>
          <span className="font-bold text-black">{p.name}</span>
          <span className="block text-xs font-mono text-gray-500">{p.code}</span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Base Price',
      render: (p) => (
        <span className="font-extrabold text-black">
          {formatCurrency(p.price)} <span className="text-xs font-normal text-gray-500">/{p.billingCycle.toLowerCase()}</span>
        </span>
      ),
    },
    {
      key: 'maxUsers',
      header: 'Role / User Limit',
      render: (p) => (
        <span className="font-bold text-gray-800">
          {p.maxUsers} <span className="text-xs font-normal text-gray-500">accounts</span>
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Tier Type',
      render: (p) => (
        <Badge variant={p.isCustom ? 'primary' : 'neutral'}>
          {p.isCustom ? 'CUSTOMIZABLE' : 'STANDARD'}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <Badge variant={p.isActive ? 'success' : 'danger'}>
          {p.isActive ? 'ACTIVE' : 'INACTIVE'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <Button variant="ghost" size="sm" onClick={() => openEditModal(p)}>
          <Edit className="w-3.5 h-3.5 mr-1" /> Configure
        </Button>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['super_admin']}>
      <DashboardLayout>
        <div className="text-black">
          <PageHeader
            title="SaaS Subscription Plans & Pricing"
            description="Manage Basic, Pro, Pro Max, and custom enterprise plan tiers and user entitlements"
            breadcrumbs={[{ label: 'Platform' }, { label: 'Plans & Pricing' }]}
            primaryAction={{
              label: 'Create Custom Plan',
              icon: <Plus className="w-4 h-4" />,
              onClick: openCreateModal,
            }}
          />

          {/* Plan Cards Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {plans.map((p) => (
              <div
                key={p.id}
                className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xs flex flex-col justify-between hover:border-orange-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge
                      variant={p.code === 'PRO_MAX' ? 'primary' : p.code === 'PRO' ? 'success' : 'neutral'}
                      className="font-bold"
                    >
                      {p.code}
                    </Badge>
                    <span className="text-xs text-gray-400 font-mono">{p.billingCycle}</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-black">{p.name}</h3>
                  <p className="text-xs text-gray-600 mt-1 min-h-[32px]">{p.description || 'Enterprise water plant plan'}</p>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-3xl font-extrabold text-black">
                      {formatCurrency(p.price)}
                      <span className="text-xs font-normal text-gray-500"> / month</span>
                    </p>
                    <p className="text-xs font-semibold text-orange-600 mt-1">
                      Entitlement: {p.maxUsers} authorized operational account(s)
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {p.isActive ? 'Active for new companies' : 'Disabled'}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => openEditModal(p)}>
                    Edit Pricing
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-orange-600" />
                <span>All Configured Subscription Plans</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                columns={columns}
                data={plans}
                emptyText="No plans configured"
              />
            </CardContent>
          </Card>

          {/* Modal */}
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={isEditing ? `Edit Plan: ${selectedPlan?.name}` : 'Create Subscription Plan'}
            description="Configure plan pricing, user creation limits, and billing details"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSubmit} loading={isSubmitting}>
                  Save Plan
                </Button>
              </>
            }
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Plan Name"
                required
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Enterprise Custom"
              />

              {!isEditing && (
                <Input
                  label="Plan Code (Unique)"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="e.g. ENTERPRISE_CUSTOM"
                />
              )}

              <Input
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe plan scope and limits"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Monthly Base Price (₹)"
                  type="number"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                />

                <Input
                  label="Allowed Role/Account Limit"
                  type="number"
                  required
                  value={formData.maxUsers}
                  onChange={(e) => setFormData((f) => ({ ...f, maxUsers: parseInt(e.target.value, 10) || 1 }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Default Billing Cycle"
                  value={formData.billingCycle}
                  onChange={(e) => setFormData((f) => ({ ...f, billingCycle: e.target.value }))}
                  options={[
                    { label: 'Monthly', value: 'MONTHLY' },
                    { label: 'Quarterly', value: 'QUARTERLY' },
                    { label: 'Annual', value: 'ANNUAL' },
                  ]}
                />

                <Select
                  label="Plan Active Status"
                  value={formData.isActive ? 'true' : 'false'}
                  onChange={(e) => setFormData((f) => ({ ...f, isActive: e.target.value === 'true' }))}
                  options={[
                    { label: 'Active', value: 'true' },
                    { label: 'Inactive / Hidden', value: 'false' },
                  ]}
                />
              </div>
            </form>
          </Modal>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
