import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { 
  Factory, 
  Package, 
  Truck, 
  PlayCircle, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ManagerDashboardPage() {
  const { user } = useAuth();

  const assignments = user?.assignments || ['production', 'store', 'distribution'];

  return (
    <AuthGuard allowedRoles={['manager', 'admin']}>
      <DashboardLayout>
        <PageHeader
          title="Operations Manager Dashboard"
          description={`Assigned Modules: ${assignments.map(a => a.toUpperCase()).join(', ')}`}
          breadcrumbs={[{ label: 'Manager Dashboard' }]}
          primaryAction={{
            label: 'Quick Shift Log',
            icon: <PlayCircle className="w-4 h-4" />,
            onClick: () => alert('Quick shift log modal...'),
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {assignments.includes('production') && (
            <Card variant="interactive" className="border-t-4 border-t-[#0F4C81]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Factory className="w-5 h-5 text-[#0F4C81]" />
                  <span>Production Line</span>
                </CardTitle>
                <Badge variant="primary">Active</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-[#172033]">48,500 L</p>
                  <p className="text-xs text-[#64748B]">Bottling target 85% achieved</p>
                </div>
                <div className="flex gap-2">
                  <Link to="/manager/production" className="w-full">
                    <Button variant="outline" size="sm" fullWidth>Line Details</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {assignments.includes('store') && (
            <Card variant="interactive" className="border-t-4 border-t-[#1597D4]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#1597D4]" />
                  <span>Store & Inventory (RAM)</span>
                </CardTitle>
                <Badge variant="secondary">RAM Module</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-[#172033]">14,250 Jars</p>
                  <p className="text-xs text-[#64748B]">Caps, Preforms, Label stock normal</p>
                </div>
                <div className="flex gap-2">
                  <Link to="/manager/inventory" className="w-full">
                    <Button variant="outline" size="sm" fullWidth>Open Store</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {assignments.includes('distribution') && (
            <Card variant="interactive" className="border-t-4 border-t-[#22B8CF]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#22B8CF]" />
                  <span>Distribution & Dispatch</span>
                </CardTitle>
                <Badge variant="info">12 Dispatched</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-[#172033]">18 Orders</p>
                  <p className="text-xs text-[#64748B]">6 Pending loading vehicles</p>
                </div>
                <div className="flex gap-2">
                  <Link to="/manager/distribution" className="w-full">
                    <Button variant="outline" size="sm" fullWidth>Dispatch View</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#0F4C81]" />
              <span>Phase 1 Frontend Foundation Teammates Status (React.js)</span>
            </CardTitle>
            <CardDescription>
              All shared components ready for parallel team development
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <h4 className="font-bold text-sm text-[#172033] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>RAM (Store Lead)</span>
              </h4>
              <p className="text-xs text-[#64748B] mt-1">UNBLOCKED. Can import Button, Card, Table, Badge, Modal directly from `@/components/ui`.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <h4 className="font-bold text-sm text-[#172033] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>NIRANJAN (HR & Ops Lead)</span>
              </h4>
              <p className="text-xs text-[#64748B] mt-1">UNBLOCKED. Attendance, Leave, Overtime, Production shells ready.</p>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
              <h4 className="font-bold text-sm text-[#172033] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>YASH (Finance Lead)</span>
              </h4>
              <p className="text-xs text-[#64748B] mt-1">UNBLOCKED. Distributor & Accountant navigation, types, layout bound.</p>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
