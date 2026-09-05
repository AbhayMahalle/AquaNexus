import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  Truck,
  Search,
  Plus,
  FilterX,
  Package,
  Clock,
  Eye,
  CheckCircle2,
  Send,
  Building2
} from 'lucide-react';

export interface StoreDispatchRecord {
  id: string;
  dispatchNumber: string;
  distributorName: string;
  routeZone?: string;
  productName: string;
  quantity: string | number;
  unit: string;
  vehicleNumber?: string;
  gatePassNumber?: string;
  date: string;
  storeOfficer: string;
  status: 'dispatched' | 'staged' | 'pending_gatepass' | 'on_hold';
  notes?: string;
}

export default function DispatchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<StoreDispatchRecord | null>(null);

  // Form states (API-ready)
  const [formDispatchNo, setFormDispatchNo] = useState('');
  const [formDistributor, setFormDistributor] = useState('');
  const [formRoute, setFormRoute] = useState('route_north');
  const [formProduct, setFormProduct] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('jars');
  const [formVehicle, setFormVehicle] = useState('');
  const [formGatePass, setFormGatePass] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // API-ready state
  const dispatchRecords: StoreDispatchRecord[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

  const destinationOptions = [
    { label: 'All Distributor Routes', value: 'all' },
    { label: 'Route North (Urban Retailers)', value: 'route_north' },
    { label: 'Route South (Commercial Towers)', value: 'route_south' },
    { label: 'Metro Direct Fleet', value: 'metro_fleet' },
    { label: 'Wholesale Depot Logistics', value: 'wholesale_depot' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Dispatched & Gate Cleared', value: 'dispatched' },
    { label: 'Staged for Loading', value: 'staged' },
    { label: 'Pending Gate Pass', value: 'pending_gatepass' },
    { label: 'On Hold', value: 'on_hold' },
  ];

  const columns: Column<StoreDispatchRecord>[] = [
    {
      key: 'date',
      header: 'Date & Time',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{r.date}</span>
        </div>
      )
    },
    {
      key: 'dispatchNumber',
      header: 'Dispatch / Gate Pass',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-xs text-[#0F4C81] block">{r.dispatchNumber}</span>
          {r.gatePassNumber && <span className="text-[11px] font-mono text-[#64748B]">Pass: {r.gatePassNumber}</span>}
        </div>
      )
    },
    {
      key: 'distributorName',
      header: 'Distributor / Destination',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.distributorName}</span>
          {r.routeZone && <span className="text-[11px] text-[#64748B]">{r.routeZone}</span>}
        </div>
      )
    },
    {
      key: 'productName',
      header: 'Finished Product',
      render: (r) => <span className="font-medium text-[#172033]">{r.productName}</span>
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantity} {r.unit}
        </span>
      )
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      render: (r) => <span className="font-mono text-xs text-[#64748B]">{r.vehicleNumber || '--'}</span>
    },
    {
      key: 'storeOfficer',
      header: 'Store Officer',
      render: (r) => <span className="text-xs text-[#172033] font-medium">{r.storeOfficer}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const statusMap: Record<string, { variant: 'success' | 'info' | 'warning' | 'danger'; label: string }> = {
          dispatched: { variant: 'success', label: 'DISPATCHED' },
          staged: { variant: 'info', label: 'STAGED' },
          pending_gatepass: { variant: 'warning', label: 'PENDING PASS' },
          on_hold: { variant: 'danger', label: 'ON HOLD' },
        };
        const config = statusMap[r.status] || { variant: 'info', label: r.status };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedDispatch(r)}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Details
        </Button>
      )
    }
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setDestinationFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setIsEntryModalOpen(false);
      setFormDispatchNo('');
      setFormDistributor('');
      setFormProduct('');
      setFormQuantity('');
      setFormVehicle('');
      setFormGatePass('');
    }, 1200);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Store Outbound Dispatch"
          description="Manage vehicle loading manifests, finished water stock deduction, and distributor gate pass logistics."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Dispatch' }
          ]}
          secondaryActions={[
            {
              label: 'Stock Out Log',
              href: '/store/stock-out',
              icon: <Package className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Stage Outbound Dispatch',
            icon: <Plus className="w-4 h-4" />,
            onClick: () => setIsEntryModalOpen(true),
          }}
        />

        {/* Search & Filter Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Search Dispatch Orders"
                  placeholder="Search by Dispatch #, Distributor, or Vehicle..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Distributor Route"
                  value={destinationFilter}
                  onChange={(e) => setDestinationFilter(e.target.value)}
                  options={destinationOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Dispatch Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={statusOptions}
                  />
                </div>

                {(searchQuery || destinationFilter !== 'all' || statusFilter !== 'all') && (
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={handleResetFilters}
                    title="Reset filters"
                    className="shrink-0 text-xs px-2.5"
                  >
                    <FilterX className="w-4 h-4 text-[#64748B]" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dispatch Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#2563EB]" />
                  <span>Store Dispatch & Gate Pass Registry</span>
                </CardTitle>
                <CardDescription>
                  Finished 20L jars and packaged water dispatches with vehicle authorizations.
                </CardDescription>
              </div>

              <Badge variant="info" size="sm">
                Store → Distributor Link
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={dispatchRecords}
              loading={isLoading}
              emptyText="No dispatch orders found"
              emptyDescription="No outbound dispatches are currently logged. Click 'Stage Outbound Dispatch' to record a vehicle loading manifest."
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={10}
                onPageChange={(p) => setCurrentPage(p)}
              />
            )}
          </CardContent>
        </Card>

        {/* Modal: Stage Outbound Dispatch */}
        <Modal
          isOpen={isEntryModalOpen}
          onClose={() => setIsEntryModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#2563EB]" />
              <span>Stage Outbound Dispatch Order</span>
            </div>
          }
          description="Prepare vehicle loading order and release finished water goods from store inventory."
          size="lg"
        >
          {submittedMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#172033]">Dispatch Manifest Staged</h4>
              <p className="text-xs text-[#64748B]">Payload prepared for gate pass validation and distributor handover.</p>
            </div>
          ) : (
            <form onSubmit={handleEntrySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Dispatch Manifest #"
                  required
                  placeholder="e.g. DSP-2026-0045"
                  value={formDispatchNo}
                  onChange={(e) => setFormDispatchNo(e.target.value)}
                />

                <Input
                  label="Distributor Name"
                  required
                  placeholder="e.g. Apex Water Distributors Ltd"
                  value={formDistributor}
                  onChange={(e) => setFormDistributor(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Route Zone"
                  value={formRoute}
                  onChange={(e) => setFormRoute(e.target.value)}
                  options={[
                    { label: 'Route North (Urban Retailers)', value: 'route_north' },
                    { label: 'Route South (Commercial Towers)', value: 'route_south' },
                    { label: 'Metro Direct Fleet', value: 'metro_fleet' },
                    { label: 'Wholesale Depot Logistics', value: 'wholesale_depot' },
                  ]}
                />

                <Input
                  label="Product to Dispatch"
                  required
                  placeholder="e.g. 20L Filled Natural Mineral Water Jars"
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  leftIcon={<Package className="w-4 h-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Quantity to Load"
                  required
                  type="number"
                  placeholder="0"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                />

                <Select
                  label="Unit"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  options={[
                    { label: '20L Jars', value: 'jars' },
                    { label: 'Cartons (1L x 12)', value: 'cartons' },
                    { label: 'Bottles (500ml)', value: 'bottles' },
                  ]}
                />

                <Input
                  label="Delivery Vehicle #"
                  placeholder="e.g. MH-12-AB-9876"
                  value={formVehicle}
                  onChange={(e) => setFormVehicle(e.target.value)}
                />
              </div>

              <div>
                <Input
                  label="Gate Pass / Security Reference #"
                  placeholder="e.g. GP-2026-880"
                  value={formGatePass}
                  onChange={(e) => setFormGatePass(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" leftIcon={<Send className="w-4 h-4" />}>
                  Authorize Dispatch Loading
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal: View Dispatch Details */}
        {selectedDispatch && (
          <Modal
            isOpen={!!selectedDispatch}
            onClose={() => setSelectedDispatch(null)}
            title={`Dispatch Record: ${selectedDispatch.dispatchNumber}`}
            description="Outbound distribution loading details."
            footer={
              <Button variant="outline" size="sm" onClick={() => setSelectedDispatch(null)}>
                Close
              </Button>
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                <div>
                  <span className="text-[#64748B] block">Distributor</span>
                  <span className="font-bold text-[#172033]">{selectedDispatch.distributorName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Product & Quantity</span>
                  <span className="font-bold font-mono text-[#172033]">{selectedDispatch.quantity} {selectedDispatch.unit}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Vehicle</span>
                  <span>{selectedDispatch.vehicleNumber || '--'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Store Officer</span>
                  <span>{selectedDispatch.storeOfficer}</span>
                </div>
              </div>
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
