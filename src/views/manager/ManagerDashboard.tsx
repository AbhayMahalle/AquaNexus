'use client';
import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { fetchApi } from '@/services/apiClient';
import { productionService } from '@/services/productionService';
import { formatNumber } from '@/lib/utils';
import { 
  Factory, 
  Package, 
  Truck, 
  RefreshCw, 
  CheckCircle2, 
  Layers,
  Users,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    productionTotal: 0,
    completedBatches: 0,
    inProgressBatches: 0,
    inventoryUnits: 0,
    inventorySkus: 0,
    ordersCount: 0,
    dispatchedCount: 0,
    pendingDispatches: 0,
    activeStaff: 0,
    totalStaff: 0,
  });

  const assignments = (user?.role === 'admin' || !user?.assignments || user.assignments.length === 0) 
    ? ['production', 'store', 'distribution'] 
    : user.assignments;

  const loadManagerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [batchesRes, statsRes, invRes, ordersRes, dispRes, empRes] = await Promise.all([
        productionService.getProductionBatches({}),
        fetch('/api/production/stats', { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetchApi<any>('/inventory'),
        fetchApi<any>('/orders'),
        fetchApi<any>('/dispatches'),
        fetchApi<any>('/employees'),
      ]);

      let productionTotal = 0;
      let completedBatches = 0;
      let inProgressBatches = 0;
      if (statsRes.success && statsRes.data) {
        productionTotal = statsRes.data.totalQuantity || 0;
        completedBatches = statsRes.data.completedBatches || 0;
        inProgressBatches = statsRes.data.inProgressBatches || 0;
      } else if (batchesRes.success && Array.isArray(batchesRes.data)) {
        productionTotal = batchesRes.data.reduce((sum: number, b: any) => sum + (Number(b.quantityProduced) || 0), 0);
        completedBatches = batchesRes.data.filter((b: any) => b.status === 'COMPLETED').length;
        inProgressBatches = batchesRes.data.filter((b: any) => b.status === 'IN_PROGRESS').length;
      }

      let inventoryUnits = 0;
      let inventorySkus = 0;
      if (invRes.success) {
        const invList = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.inventory || []);
        inventorySkus = invList.length;
        inventoryUnits = invList.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 0), 0);
      }

      let ordersCount = 0;
      if (ordersRes.success) {
        const oList = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.orders || []);
        ordersCount = oList.length;
      }

      let dispatchedCount = 0;
      let pendingDispatches = 0;
      if (dispRes.success) {
        const dList = Array.isArray(dispRes.data) ? dispRes.data : (dispRes.data?.dispatches || []);
        dispatchedCount = dList.filter((d: any) => d.status === 'DISPATCHED' || d.status === 'COMPLETED').length;
        pendingDispatches = dList.filter((d: any) => d.status === 'PREPARING' || d.status === 'PENDING').length;
      }

      let activeStaff = 0;
      let totalStaff = 0;
      if (empRes.success) {
        const eList = Array.isArray(empRes.data) ? empRes.data : (empRes.data?.employees || []);
        totalStaff = eList.length;
        activeStaff = eList.filter((e: any) => e.status === 'ACTIVE').length;
      }

      setStats({
        productionTotal,
        completedBatches,
        inProgressBatches,
        inventoryUnits,
        inventorySkus,
        ordersCount,
        dispatchedCount,
        pendingDispatches,
        activeStaff,
        totalStaff,
      });
    } catch (err) {
      console.error('Error fetching manager dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  return (
    <AuthGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <PageHeader
          title="Operations Manager Dashboard"
          description={`Assigned Modules: ${assignments.map(a => a.toUpperCase()).join(', ')}`}
          breadcrumbs={[{ label: 'Manager Dashboard' }]}
          primaryAction={{
            label: 'Refresh Status',
            icon: <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />,
            onClick: loadManagerData,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {assignments.includes('production') && (
            <Card variant="interactive" className="border-t-4 border-t-orange-600">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Factory className="w-5 h-5 text-orange-600" />
                  <span>Production Line</span>
                </CardTitle>
                <Badge variant={stats.inProgressBatches > 0 ? 'warning' : 'success'}>
                  {stats.inProgressBatches > 0 ? `${stats.inProgressBatches} In Progress` : 'Live'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-black">
                    {formatNumber(stats.productionTotal)} L
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats.completedBatches} batches completed successfully
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={user?.role === 'admin' ? '/admin/production' : '/manager/production'} className="w-full">
                    <Button variant="outline" size="sm" fullWidth>Line Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {assignments.includes('store') && (
            <Card variant="interactive" className="border-t-4 border-t-black">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-black" />
                  <span>Store & Inventory</span>
                </CardTitle>
                <Badge variant="secondary">
                  {stats.inventorySkus} SKUs
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-black">
                    {formatNumber(stats.inventoryUnits)} Units
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Total items in central storage</p>
                </div>
                <div className="flex gap-2">
                  <Link to={user?.role === 'admin' ? '/admin/store/inventory' : '/manager/store/inventory'} className="w-full">
                    <Button variant="outline" size="sm" fullWidth>Open Store</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {assignments.includes('distribution') && (
            <Card variant="interactive" className="border-t-4 border-t-orange-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-600" />
                  <span>Distribution & Dispatch</span>
                </CardTitle>
                <Badge variant="success">{stats.dispatchedCount} Dispatched</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-black">{stats.ordersCount} Orders</p>
                  <p className="text-xs text-gray-600 mt-1">{stats.pendingDispatches} Pending loading vehicles</p>
                </div>
                <div className="flex gap-2">
                  <Link to={user?.role === 'admin' ? '/admin/distribution' : '/manager/distribution'} className="w-full">
                    <Button variant="outline" size="sm" fullWidth>Dispatch Hub</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              <span>Shift Operations & Station Readiness</span>
            </CardTitle>
            <CardDescription>
              Real-time operational status across plant departments
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <h4 className="font-bold text-sm text-black flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Raw Materials & Store</span>
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {stats.inventoryUnits > 0 
                  ? `${formatNumber(stats.inventoryUnits)} units available across ${stats.inventorySkus} stock lines.`
                  : 'Central store ledger operational.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <h4 className="font-bold text-sm text-black flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-600" />
                <span>Line Personnel & Staff</span>
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {stats.activeStaff} of {stats.totalStaff} staff members currently active and deployed.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <h4 className="font-bold text-sm text-black flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Logistics & Route Dispatch</span>
              </h4>
              <p className="text-xs text-gray-600 mt-1">
                {stats.pendingDispatches > 0
                  ? `${stats.pendingDispatches} consignments queued for staging and delivery.`
                  : 'All current dispatch queues processed.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}