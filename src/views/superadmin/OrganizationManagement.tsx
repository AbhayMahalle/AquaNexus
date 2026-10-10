'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { apiRequest, showToast } from '@/lib/api';
import { setSelectedOrganization } from '@/lib/auth';
import {
  Building2,
  Plus,
  Shield,
  Search,
  ExternalLink,
  Ban,
  CheckCircle2,
  Users,
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trash2,
  Layers,
  Sparkles,
} from 'lucide-react';

interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED';
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  companyType?: string;
  createdAt: string;
  updatedAt: string;
  subscription?: {
    id: string;
    status: string;
    planName?: string;
    planCode?: string;
    plan?: {
      name: string;
      code: string;
      tier?: string;
      maxUsers: number;
      priceMonthly?: number;
    };
    maxUsers?: number;
    customMaxUsers?: number;
    customPrice?: number;
    price?: number;
    startDate?: string;
    endDate?: string;
    expiresAt?: string;
  };
  users?: Array<{
    id: string;
    username: string;
    email: string;
    role?: { name: string };
  }>;
  admins?: Array<{
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    status: string;
  }>;
  stats?: {
    userCount: number;
    employeeCount: number;
    orderCount: number;
    productCount: number;
  };
  _count?: {
    users: number;
    employees: number;
    orders: number;
  };
}

export default function OrganizationManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');

  // Provision Modal State
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    gstNumber: '',
    planCode: 'BASIC',
    customPrice: '',
    customMaxUsers: '25',
    adminFirstName: '',
    adminLastName: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
  });

  // Status Modal State
  const [selectedOrgForStatus, setSelectedOrgForStatus] = useState<OrganizationRecord | null>(null);
  const [statusModalReason, setStatusModalReason] = useState('');
  const [isStatusSubmitting, setIsStatusSubmitting] = useState(false);

  // Delete Company Modal State
  const [selectedOrgForDelete, setSelectedOrgForDelete] = useState<OrganizationRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update Plan Modal State
  const [selectedOrgForPlan, setSelectedOrgForPlan] = useState<OrganizationRecord | null>(null);
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [planFormData, setPlanFormData] = useState({
    planCode: 'BASIC',
    billingCycle: 'MONTHLY',
    durationDays: 30,
    customPrice: '',
    customMaxUsers: '',
    notes: '',
  });

  const fetchPlans = async () => {
    try {
      const res = await apiRequest<any>('/platform/plans');
      if (res.ok && res.data) {
        const rawPlans = res.data.plans || res.data || [];
        setAvailablePlans(rawPlans);
      }
    } catch (err: any) {
      console.error('Failed to fetch subscription plans:', err);
    }
  };

  const fetchOrganizations = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/platform/organizations');
      if (res.ok && res.data) {
        const raw = res.data;
        const orgList = Array.isArray(raw) ? raw : (raw.organizations || []);
        setOrganizations(orgList);
      } else {
        showToast(res.error || 'Failed to load customer organizations', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error fetching organizations', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    fetchPlans();
  }, []);

  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      const matchesSearch =
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.contactEmail && org.contactEmail.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'ALL' || org.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [organizations, searchTerm, statusFilter]);

  const kpis = useMemo(() => {
    const total = organizations.length;
    const active = organizations.filter((o) => o.status === 'ACTIVE').length;
    const suspended = organizations.filter((o) => o.status === 'SUSPENDED').length;
    const totalUsers = organizations.reduce((sum, o) => sum + (o._count?.users || o.users?.length || 0), 0);
    return { total, active, suspended, totalUsers };
  }, [organizations]);

  const handleNameChange = (val: string) => {
    const autoSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: prev.slug === '' || prev.slug === autoSlug.slice(0, -1) ? autoSlug : prev.slug,
    }));
  };

  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.adminEmail || !formData.adminPassword) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<{ organization: OrganizationRecord; initialAdmin: any }>(
        '/platform/organizations',
        {
          method: 'POST',
          body: JSON.stringify(formData),
        }
      );

      if (res.ok) {
        showToast(`Organization "${formData.name}" provisioned successfully with Admin!`, 'success');
        setIsProvisionOpen(false);
        setFormData({
          name: '',
          slug: '',
          contactEmail: '',
          contactPhone: '',
          address: '',
          city: '',
          state: '',
          gstNumber: '',
          planCode: 'BASIC',
          customPrice: '',
          customMaxUsers: '25',
          adminFirstName: '',
          adminLastName: '',
          adminUsername: '',
          adminEmail: '',
          adminPassword: '',
        });
        fetchOrganizations();
      } else {
        showToast(res.error || 'Failed to provision organization', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Provisioning error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleToggleStatus = async () => {
    if (!selectedOrgForStatus) return;
    const targetStatus = selectedOrgForStatus.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    setIsStatusSubmitting(true);
    try {
      const res = await apiRequest(`/platform/organizations/${selectedOrgForStatus.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: targetStatus,
          reason: statusModalReason || `Status changed to ${targetStatus} by SuperAdmin`,
        }),
      });

      if (res.ok) {
        showToast(`Organization status updated to ${targetStatus}`, 'success');
        setSelectedOrgForStatus(null);
        setStatusModalReason('');
        fetchOrganizations();
      } else {
        showToast(res.error || 'Failed to update organization status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setIsStatusSubmitting(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedOrgForDelete) return;
    setIsDeleting(true);
    try {
      const res = await apiRequest(`/platform/companies/${selectedOrgForDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast(
          `Company "${selectedOrgForDelete.name}", its administrators, and all associated user accounts deleted successfully.`,
          'success'
        );
        setSelectedOrgForDelete(null);
        fetchOrganizations();
      } else {
        showToast(res.error || 'Failed to delete company', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting company', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenPlanModal = (org: OrganizationRecord) => {
    setSelectedOrgForPlan(org);
    const existingPlan = org.subscription?.planCode || org.subscription?.plan?.code || 'BASIC';
    const matchedPlan = availablePlans.find((p) => p.code?.toUpperCase() === existingPlan.toUpperCase());

    setPlanFormData({
      planCode: existingPlan,
      billingCycle: matchedPlan?.billingCycle || 'MONTHLY',
      durationDays: 30,
      customPrice: org.subscription?.price !== undefined ? String(org.subscription.price) : (matchedPlan?.price !== undefined ? String(matchedPlan.price) : ''),
      customMaxUsers: org.subscription?.maxUsers !== undefined ? String(org.subscription.maxUsers) : (matchedPlan?.maxUsers !== undefined ? String(matchedPlan.maxUsers) : ''),
      notes: '',
    });
  };

  const handleUpdatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrgForPlan) return;

    setIsUpdatingPlan(true);
    try {
      const body: any = {
        companyId: selectedOrgForPlan.id,
        planCode: planFormData.planCode,
        billingCycle: planFormData.billingCycle,
        durationDays: Number(planFormData.durationDays) || 30,
        notes: planFormData.notes || `Plan updated to ${planFormData.planCode} by SuperAdmin`,
      };

      if (planFormData.customPrice) {
        body.customPrice = Number(planFormData.customPrice);
      }
      if (planFormData.customMaxUsers) {
        body.maxUsers = parseInt(planFormData.customMaxUsers, 10);
      }

      const res = await apiRequest(`/platform/companies/${selectedOrgForPlan.id}/subscription`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        showToast(`Plan successfully updated to ${planFormData.planCode} for "${selectedOrgForPlan.name}"!`, 'success');
        setSelectedOrgForPlan(null);
        fetchOrganizations();
      } else {
        showToast(res.error || 'Failed to update plan', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating plan', 'error');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const columns: Column<OrganizationRecord>[] = [
    {
      key: 'company',
      header: 'Company / Organization',
      accessor: (row) => (
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold shrink-0 mt-0.5">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <span>{row.name}</span>
              {row.id === user?.selectedOrganizationId && (
                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                  Active Context
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 font-mono">slug: {row.slug}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Subscription Plan',
      accessor: (row) => {
        const sub = row.subscription;
        if (!sub) {
          return (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400">Not assigned</span>
              <button
                type="button"
                onClick={() => handleOpenPlanModal(row)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline"
              >
                + Assign Plan
              </button>
            </div>
          );
        }
        const planCode = sub.planCode || sub.plan?.code || 'BASIC';
        const planName = sub.planName || sub.plan?.name || planCode;
        const color =
          planCode === 'PRO_MAX'
            ? 'bg-purple-100 text-purple-800 border-purple-200'
            : planCode === 'PRO'
            ? 'bg-blue-100 text-blue-800 border-blue-200'
            : planCode === 'PLUS'
            ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
            : 'bg-emerald-100 text-emerald-800 border-emerald-200';
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${color}`}>
                {planName}
              </span>
              <button
                type="button"
                onClick={() => handleOpenPlanModal(row)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-0.5"
                title="Update Plan"
              >
                <Sparkles className="w-3 h-3" />
                Change
              </button>
            </div>
            <div className="text-[11px] text-gray-500">
              Capacity: {sub.maxUsers || sub.customMaxUsers || sub.plan?.maxUsers || 1} accounts
            </div>
          </div>
        );
      },
    },
    {
      key: 'administrator',
      header: 'Company Administrator',
      accessor: (row) => {
        const primary = row.admins && row.admins.length > 0 ? row.admins[0] : null;
        if (!primary) {
          return <span className="text-xs text-gray-400 italic">No admin assigned</span>;
        }
        return (
          <div className="space-y-0.5 min-w-[170px]">
            <div className="flex items-center gap-1.5 font-bold text-xs text-gray-900">
              <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{`${primary.firstName || ''} ${primary.lastName || ''}`.trim() || primary.username}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-600 font-mono">
              <Mail className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate max-w-[170px]" title={primary.email}>{primary.email}</span>
            </div>
            {primary.phone && (
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                <span>{primary.phone}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'ACTIVE' ? 'success' : 'danger'}>
          {row.status === 'ACTIVE' ? '● Active' : '✕ Suspended'}
        </Badge>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Details',
      accessor: (row) => (
        <div className="text-xs text-gray-700 space-y-0.5">
          {row.contactEmail && (
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-gray-400" />
              <span>{row.contactEmail}</span>
            </div>
          )}
          {row.contactPhone && (
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-gray-400" />
              <span>{row.contactPhone}</span>
            </div>
          )}
          {row.address && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="truncate max-w-[180px]">{row.address}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'users',
      header: 'Users / Staff',
      accessor: (row) => (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{row._count?.users ?? row.users?.length ?? 0} Accounts</span>
        </div>
      ),
    },
    {
      key: 'created',
      header: 'Provisioned',
      accessor: (row) => (
        <div className="text-xs text-gray-600 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span>{new Date(row.createdAt).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenPlanModal(row)}
            title="Update Subscription Plan"
            className="text-blue-700 hover:bg-blue-50 border-blue-200 p-1.5 h-8 w-8 flex items-center justify-center"
          >
            <Layers className="w-3.5 h-3.5" />
          </Button>

          <Button
            size="sm"
            variant={row.status === 'ACTIVE' ? 'ghost' : 'outline'}
            onClick={() => {
              setSelectedOrgForStatus(row);
              setStatusModalReason('');
            }}
            title={row.status === 'ACTIVE' ? 'Suspend Organization' : 'Activate Organization'}
            className={row.status === 'ACTIVE' ? 'text-amber-600 hover:bg-amber-50 border border-amber-200 p-1.5 h-8 w-8 flex items-center justify-center' : 'text-emerald-700 hover:bg-emerald-50 border border-emerald-200 p-1.5 h-8 w-8 flex items-center justify-center'}
          >
            {row.status === 'ACTIVE' ? <Ban className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedOrgForDelete(row)}
            title="Delete Company (Cascade Deletes Admin & All Users)"
            className="text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 p-1.5 h-8 w-8 flex items-center justify-center"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['super_admin']}>
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Customer Organizations"
            description="Platform SuperAdmin governance: provision client companies and manage tenant status."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsProvisionOpen(true)}
                leftIcon={<Building2 className="w-4 h-4" />}
              >
                Provision Organization
              </Button>
            }
          />

        {/* Platform KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Companies</p>
                <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{kpis.total}</h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-200">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Tenants</p>
                <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{kpis.active}</h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Suspended Tenants</p>
                <h3 className="text-2xl font-extrabold text-red-600 mt-1">{kpis.suspended}</h3>
              </div>
              <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-200">
                <Ban className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Platform Users</p>
                <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{kpis.totalUsers}</h3>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* Organizations Table Card */}
        <Card className="border-gray-200">
          <CardHeader className="border-b border-gray-200 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-base font-bold text-gray-900">
                  Customer Organizations ({filteredOrgs.length})
                </CardTitle>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative w-64">
                  <Input
                    placeholder="Search by company or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-4 h-4 text-gray-400" />}
                  />
                </div>

                <div className="flex items-center rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-semibold">
                  <button
                    onClick={() => setStatusFilter('ALL')}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      statusFilter === 'ALL' ? 'bg-white text-black shadow-xs font-bold' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('ACTIVE')}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      statusFilter === 'ACTIVE' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => setStatusFilter('SUSPENDED')}
                    className={`px-3 py-1.5 rounded-md transition-colors ${
                      statusFilter === 'SUSPENDED' ? 'bg-white text-red-700 shadow-xs font-bold' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    Suspended
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table
              columns={columns}
              data={filteredOrgs}
              keyExtractor={(row) => row.id}
              loading={isLoading}
              emptyMessage="No customer organizations found matching criteria."
            />
          </CardContent>
        </Card>
      </div>

      {/* Provision New Organization Modal */}
      <Modal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        title="Provision Customer Organization & Admin"
        description="Add a client company organization and configure its primary Administrator account in a unified atomic transaction."
        size="lg"
      >
        <form onSubmit={handleProvisionSubmit} className="space-y-5">
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Multi-Tenant Provisioning Invariant</span>
            </div>
            <p>
              This transaction provisions a distinct organization container and an initial Company Admin.
              Company operational records are strictly scoped to this organization.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
              Company Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name *"
                placeholder="e.g. Apex Pure Waters Ltd"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
              <Input
                label="Organization Slug *"
                placeholder="e.g. apex-pure-waters"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Email"
                type="email"
                placeholder="contact@apexwater.com"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              />
              <Input
                label="Contact Phone"
                placeholder="+91 98765 00000"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              />
            </div>

            <Input
              label="Plant / Office Address"
              placeholder="Plot 42, MIDC Industrial Area, Pune"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Subscription Plan from Database ({availablePlans.length} Available)
              </h4>
              <button
                type="button"
                onClick={() => navigate('/super-admin/plans')}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium underline flex items-center gap-1"
              >
                + Create Custom Plan in DB
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-[220px] overflow-y-auto p-0.5">
              {(availablePlans.length > 0 ? availablePlans : [
                { code: 'BASIC', name: 'Basic Plan', price: 999, maxUsers: 1, billingCycle: 'MONTHLY', isCustom: false },
                { code: 'PLUS', name: 'Plus Plan', price: 1999, maxUsers: 2, billingCycle: 'MONTHLY', isCustom: false },
                { code: 'PRO', name: 'Pro Plan', price: 2999, maxUsers: 5, billingCycle: 'MONTHLY', isCustom: false },
                { code: 'PRO_MAX', name: 'Pro Max', price: 9999, maxUsers: 50, billingCycle: 'MONTHLY', isCustom: false },
              ]).map((p) => (
                <div
                  key={p.code}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      planCode: p.code,
                      customMaxUsers: String(p.maxUsers || 1),
                      customPrice: String(p.price || 0),
                    })
                  }
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    formData.planCode.toUpperCase() === p.code.toUpperCase()
                      ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">{p.name}</span>
                    {p.isCustom && (
                      <span className="text-[9px] bg-purple-100 text-purple-800 px-1 py-0.2 rounded font-bold">
                        Custom
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mt-0.5">₹{p.price} / {p.billingCycle?.toLowerCase() || 'mo'}</div>
                  <div className="text-[11px] text-gray-500 mt-1">{p.maxUsers} Account Limit</div>
                </div>
              ))}
            </div>

            {(formData.planCode === 'PRO_MAX' || formData.planCode === 'CUSTOM' || availablePlans.find(p => p.code === formData.planCode)?.isCustom) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-purple-50/60 border border-purple-200 rounded-xl">
                <Input
                  label="Custom User Limit *"
                  type="number"
                  placeholder="e.g. 25"
                  value={formData.customMaxUsers}
                  onChange={(e) => setFormData({ ...formData, customMaxUsers: e.target.value })}
                  required
                />
                <Input
                  label="Custom Monthly Price (₹) *"
                  type="number"
                  placeholder="e.g. 9999"
                  value={formData.customPrice}
                  onChange={(e) => setFormData({ ...formData, customPrice: e.target.value })}
                  required
                />
              </div>
            )}
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-1">
              Initial Company Administrator
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Admin First Name *"
                placeholder="e.g. Rajesh"
                value={formData.adminFirstName}
                onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                required
              />
              <Input
                label="Admin Last Name"
                placeholder="e.g. Sharma"
                value={formData.adminLastName}
                onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Admin Username"
                placeholder="e.g. rajesh.admin"
                value={formData.adminUsername}
                onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
              />
              <Input
                label="Admin Email Address *"
                type="email"
                placeholder="admin@apexwater.com"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-gray-700">Initial Password *</label>
                <button
                  type="button"
                  onClick={() => {
                    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
                    let pass = '';
                    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                    setFormData({ ...formData, adminPassword: pass });
                  }}
                  className="text-[11px] text-blue-600 hover:underline font-medium"
                >
                  Generate Strong Password
                </button>
              </div>
              <Input
                type="text"
                placeholder="Enter a secure password (min 8 chars)"
                value={formData.adminPassword}
                onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button variant="outline" type="button" onClick={() => setIsProvisionOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              Provision Company & Admin
            </Button>
          </div>
        </form>
      </Modal>

      {/* Status Toggle Modal */}
      <Modal
        isOpen={!!selectedOrgForStatus}
        onClose={() => setSelectedOrgForStatus(null)}
        title={selectedOrgForStatus?.status === 'ACTIVE' ? 'Suspend Organization' : 'Activate Organization'}
        description={`Modify operational access for "${selectedOrgForStatus?.name}".`}
      >
        <div className="space-y-4">
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              selectedOrgForStatus?.status === 'ACTIVE'
                ? 'bg-red-50 border-red-200 text-red-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {selectedOrgForStatus?.status === 'ACTIVE'
                  ? 'Access Will Be Blocked Immediately'
                  : 'Access Will Be Restored'}
              </p>
              <p className="mt-1">
                {selectedOrgForStatus?.status === 'ACTIVE'
                  ? 'All users and Admins belonging to this organization will be denied access to the ERP. Existing operational records remain preserved.'
                  : 'All authorized users of this company will regain access to their operational ERP environment.'}
              </p>
            </div>
          </div>

          <Input
            label="Reason for Status Change"
            placeholder="e.g. Account subscription active / Payment review..."
            value={statusModalReason}
            onChange={(e) => setStatusModalReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setSelectedOrgForStatus(null)}>
              Cancel
            </Button>
            <Button
              variant={selectedOrgForStatus?.status === 'ACTIVE' ? 'danger' : 'primary'}
              onClick={handleToggleStatus}
              loading={isStatusSubmitting}
            >
              {selectedOrgForStatus?.status === 'ACTIVE' ? 'Confirm Suspension' : 'Confirm Activation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Organization Modal */}
      <Modal
        isOpen={!!selectedOrgForDelete}
        onClose={() => {
          if (!isDeleting) setSelectedOrgForDelete(null);
        }}
        title="Delete Company & All Users"
        description="Permanently remove this company, its administrator, and all associated accounts."
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-900 text-sm space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-700">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>Permanent Cascading Deletion</span>
            </div>
            <p className="text-xs leading-relaxed text-red-800">
              You are about to delete <strong>"{selectedOrgForDelete?.name}"</strong> (slug: <code className="text-[11px] font-mono bg-red-100 px-1 py-0.5 rounded">{selectedOrgForDelete?.slug}</code>).
            </p>
            <p className="text-xs leading-relaxed text-red-800">
              This action <strong>CANNOT be undone</strong>. The following records will be permanently deleted:
            </p>
            <ul className="list-disc pl-5 text-xs space-y-1 text-red-800 font-medium">
              <li>
                <strong>Company Admin Account:</strong> {selectedOrgForDelete?.admins?.[0]?.email || 'Assigned Administrator'}
              </li>
              <li>
                <strong>All User Accounts:</strong> {selectedOrgForDelete?.stats?.userCount ?? selectedOrgForDelete?._count?.users ?? selectedOrgForDelete?.users?.length ?? 0} total accounts (Managers, Accountants, Staff, Distributors, Suppliers)
              </li>
              <li>
                <strong>All Operational Tenant Data:</strong> Subscriptions, Employees, Inventory, Products, Orders, Production batches, and financial records.
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-gray-600">
            Please confirm that you want to delete this company and all its associated personnel.
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setSelectedOrgForDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCompany}
              loading={isDeleting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Yes, Delete Company & All Users
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Plan Modal */}
      <Modal
        isOpen={!!selectedOrgForPlan}
        onClose={() => {
          if (!isUpdatingPlan) setSelectedOrgForPlan(null);
        }}
        title={`Update Subscription Plan — ${selectedOrgForPlan?.name}`}
        description="Select and apply a new subscription plan for this company."
      >
        <form onSubmit={handleUpdatePlanSubmit} className="space-y-4">
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-900 text-xs">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Current Subscription: {selectedOrgForPlan?.subscription?.planName || selectedOrgForPlan?.subscription?.planCode || 'None'}</span>
            </div>
            <p className="text-gray-600">
              Updating the plan will immediately adjust user capacity limits, role entitlements, and feature access for all accounts in this organization.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-gray-700">
                Select Plan from Database ({availablePlans.length} Available) *
              </label>
              <button
                type="button"
                onClick={() => navigate('/super-admin/plans')}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Custom Plan in DB
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto p-1">
              {(availablePlans.length > 0 ? availablePlans : [
                { code: 'BASIC', name: 'Basic Plan', price: 999, maxUsers: 1, billingCycle: 'MONTHLY', isCustom: false, description: 'Starter single-user plan' },
                { code: 'PLUS', name: 'Plus Plan', price: 1999, maxUsers: 2, billingCycle: 'MONTHLY', isCustom: false, description: 'Small plant operations' },
                { code: 'PRO', name: 'Pro Plan', price: 2999, maxUsers: 5, billingCycle: 'MONTHLY', isCustom: false, description: 'Growing plant operations' },
                { code: 'PRO_MAX', name: 'Pro Max Plan', price: 9999, maxUsers: 50, billingCycle: 'MONTHLY', isCustom: false, description: 'Enterprise operations' },
              ]).map((plan) => (
                <div
                  key={plan.id || plan.code}
                  onClick={() =>
                    setPlanFormData({
                      ...planFormData,
                      planCode: plan.code,
                      customMaxUsers: String(plan.maxUsers || 1),
                      customPrice: String(plan.price || 0),
                      billingCycle: plan.billingCycle || planFormData.billingCycle,
                    })
                  }
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    planFormData.planCode.toUpperCase() === plan.code.toUpperCase()
                      ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-gray-900">{plan.name}</span>
                    <span className="text-xs font-bold text-blue-700">₹{plan.price}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                      {plan.code}
                    </span>
                    {plan.isCustom && (
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                        Custom Plan
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">
                    Capacity: <strong>{plan.maxUsers}</strong> accounts
                  </div>
                  {plan.description && (
                    <div className="text-[10px] text-gray-400 mt-0.5 truncate">{plan.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1">Billing Cycle</label>
              <select
                className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={planFormData.billingCycle}
                onChange={(e) => {
                  const cycle = e.target.value;
                  let days = 30;
                  if (cycle === 'QUARTERLY') days = 90;
                  if (cycle === 'ANNUAL') days = 365;
                  setPlanFormData({ ...planFormData, billingCycle: cycle, durationDays: days });
                }}
              >
                <option value="MONTHLY">Monthly (30 Days)</option>
                <option value="QUARTERLY">Quarterly (90 Days)</option>
                <option value="ANNUAL">Annual (365 Days)</option>
                <option value="CUSTOM">Custom Duration</option>
              </select>
            </div>

            <div>
              <Input
                label="Duration (Days)"
                type="number"
                min="1"
                value={planFormData.durationDays}
                onChange={(e) => setPlanFormData({ ...planFormData, durationDays: parseInt(e.target.value, 10) || 30 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Input
                label="Custom Price Override (₹, Optional)"
                placeholder="Leave blank for plan price"
                type="number"
                min="0"
                value={planFormData.customPrice}
                onChange={(e) => setPlanFormData({ ...planFormData, customPrice: e.target.value })}
              />
            </div>
            <div>
              <Input
                label="Custom Max Users (Optional)"
                placeholder="Leave blank for plan limit"
                type="number"
                min="1"
                value={planFormData.customMaxUsers}
                onChange={(e) => setPlanFormData({ ...planFormData, customMaxUsers: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Input
              label="Notes / Reason for Plan Change"
              placeholder="e.g. Upgraded to Pro Plan upon client request"
              value={planFormData.notes}
              onChange={(e) => setPlanFormData({ ...planFormData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <Button
              variant="outline"
              type="button"
              onClick={() => setSelectedOrgForPlan(null)}
              disabled={isUpdatingPlan}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isUpdatingPlan}
              leftIcon={<Layers className="w-4 h-4" />}
            >
              Apply Subscription Plan
            </Button>
          </div>
        </form>
      </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
