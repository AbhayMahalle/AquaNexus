'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { apiRequest, showToast } from '@/lib/api';
import {
  Truck,
  Search,
  Plus,
  FilterX,
  Package,
  Clock,
  Eye,
  Send,
  Building2,
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

  // Form states
  const [distributors, setDistributors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formDistributorId, setFormDistributorId] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formVehicle, setFormVehicle] = useState('');
  const [formGatePass, setFormGatePass] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API State
  const [dispatchRecords, setDispatchRecords] = useState<StoreDispatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load distributors and products for dropdowns
  useEffect(() => {
    async function loadDropdownData() {
      try {
        const [distRes, prodRes] = await Promise.all([
          apiRequest<any>('/api/distributors'),
          apiRequest<any>('/api/products?limit=100'),
        ]);

        if (distRes.ok && distRes.data) {
          const list = distRes.data.distributors || (Array.isArray(distRes.data) ? distRes.data : []);
          setDistributors(list);
          if (list.length > 0) {
            setFormDistributorId(list[0].id);
          }
        }

        if (prodRes.ok && prodRes.data) {
          const list = prodRes.data.products || (Array.isArray(prodRes.data) ? prodRes.data : []);
          setProducts(list);
          if (list.length > 0) {
            setFormProductId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load dropdown data:', err);
      }
    }
    loadDropdownData();
  }, []);

  // Load dispatch records from backend
  const loadDispatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/api/dispatch');
      if (res.ok && res.data) {
        const list = res.data.dispatches || (Array.isArray(res.data) ? res.data : []);
        const mapped: StoreDispatchRecord[] = list.map((d: any) => {
          const vehicleMatch = d.remarks?.match(/Vehicle:\s*([^|]+)/i);
          const gatePassMatch = d.remarks?.match(/Gate Pass:\s*([^|]+)/i);
          const vehicleNumber = vehicleMatch ? vehicleMatch[1].trim() : (d.vehicleNumber || '--');
          const gatePassNumber = gatePassMatch ? gatePassMatch[1].trim() : (d.gatePassNumber || '');

          const totalQty = (d.dispatchItems || []).reduce(
            (sum: number, it: any) => sum + (Number(it.quantity) || 0),
            0
          );
          const productNames =
            (d.dispatchItems || [])
              .map((it: any) => it.product?.name)
              .filter(Boolean)
              .join(', ') || 'Finished Water Product';
          const unit = d.dispatchItems?.[0]?.product?.unit || 'Units';

          const statusRaw = (d.status || 'dispatched').toLowerCase();
          let status: StoreDispatchRecord['status'] = 'dispatched';
          if (statusRaw === 'staged' || statusRaw === 'preparing') status = 'staged';
          else if (statusRaw === 'pending_gatepass' || statusRaw === 'pending') status = 'pending_gatepass';
          else if (statusRaw === 'on_hold' || statusRaw === 'cancelled') status = 'on_hold';
          else status = 'dispatched';

          return {
            id: d.id,
            dispatchNumber: d.dispatchNumber || `DSP-${d.id.slice(0, 8)}`,
            distributorName: d.distributor?.name || 'Distributor',
            routeZone: d.distributor?.salesArea?.name || d.routeZone || '',
            productName: productNames,
            quantity: totalQty,
            unit,
            vehicleNumber,
            gatePassNumber,
            date: new Date(d.dispatchDate || d.createdAt || Date.now()).toLocaleDateString(),
            storeOfficer: d.creator
              ? `${d.creator.firstName || ''} ${d.creator.lastName || ''}`.trim()
              : 'Store Officer',
            status,
            notes: d.remarks || '',
          };
        });

        setDispatchRecords(mapped);
      }
    } catch (err) {
      console.error('Failed to load dispatches:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDispatches();
  }, [loadDispatches]);

  // Combined Filtering
  const filteredRecords = useMemo(() => {
    return dispatchRecords.filter((r) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesNo = r.dispatchNumber?.toLowerCase().includes(query);
        const matchesDist = r.distributorName?.toLowerCase().includes(query);
        const matchesProd = r.productName?.toLowerCase().includes(query);
        const matchesVeh = r.vehicleNumber?.toLowerCase().includes(query);
        const matchesPass = r.gatePassNumber?.toLowerCase().includes(query);
        const matchesZone = r.routeZone?.toLowerCase().includes(query);

        if (!matchesNo && !matchesDist && !matchesProd && !matchesVeh && !matchesPass && !matchesZone) {
          return false;
        }
      }

      if (destinationFilter !== 'all') {
        const zone = (r.routeZone || '').toLowerCase();
        if (!zone.includes(destinationFilter.toLowerCase())) {
          return false;
        }
      }

      if (statusFilter !== 'all') {
        if (r.status !== statusFilter) {
          return false;
        }
      }

      return true;
    });
  }, [dispatchRecords, searchQuery, destinationFilter, statusFilter]);

  // Pagination
  const itemsPerPage = 10;
  const totalItems = filteredRecords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRecords.slice(start, start + itemsPerPage);
  }, [filteredRecords, currentPage]);

  const destinationOptions = [
    { label: 'All Distributor Routes', value: 'all' },
    { label: 'Route North', value: 'north' },
    { label: 'Route South', value: 'south' },
    { label: 'Route East', value: 'east' },
    { label: 'Route West', value: 'west' },
    { label: 'Central', value: 'central' },
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
      ),
    },
    {
      key: 'dispatchNumber',
      header: 'Dispatch / Gate Pass',
      render: (r) => (
        <div>
          <span className="font-mono font-bold text-xs text-[#0F4C81] block">{r.dispatchNumber}</span>
          {r.gatePassNumber && <span className="text-[11px] font-mono text-[#64748B]">Pass: {r.gatePassNumber}</span>}
        </div>
      ),
    },
    {
      key: 'distributorName',
      header: 'Distributor / Destination',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.distributorName}</span>
          {r.routeZone && <span className="text-[11px] text-[#64748B]">{r.routeZone}</span>}
        </div>
      ),
    },
    {
      key: 'productName',
      header: 'Finished Product',
      render: (r) => <span className="font-medium text-[#172033]">{r.productName}</span>,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantity} {r.unit}
        </span>
      ),
    },
    {
      key: 'vehicleNumber',
      header: 'Vehicle',
      render: (r) => <span className="font-mono text-xs text-[#64748B]">{r.vehicleNumber || '--'}</span>,
    },
    {
      key: 'storeOfficer',
      header: 'Store Officer',
      render: (r) => <span className="text-xs text-[#172033] font-medium">{r.storeOfficer}</span>,
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
      },
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
      ),
    },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setDestinationFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  const handleEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDistributorId || !formProductId || !formQuantity || Number(formQuantity) <= 0) {
      showToast('Please select a distributor, product, and valid quantity', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const remarksParts = [
        formVehicle ? `Vehicle: ${formVehicle.trim()}` : '',
        formGatePass ? `Gate Pass: ${formGatePass.trim()}` : '',
        formNotes ? `Notes: ${formNotes.trim()}` : '',
      ].filter(Boolean);

      const payload = {
        distributorId: formDistributorId,
        dispatchDate: new Date().toISOString(),
        remarks: remarksParts.join(' | ') || undefined,
        items: [
          {
            productId: formProductId,
            quantity: parseInt(formQuantity, 10),
          },
        ],
      };

      const res = await apiRequest<any>('/api/dispatch', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Dispatch Order created and warehouse stock deducted successfully!', 'success');
        setIsEntryModalOpen(false);
        setFormQuantity('');
        setFormVehicle('');
        setFormGatePass('');
        setFormNotes('');
        await loadDispatches();
      } else {
        showToast(res.error || 'Failed to create dispatch order', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error processing dispatch order', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductObj = products.find((p) => p.id === formProductId);

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Store Outbound Dispatch"
          description="Manage vehicle loading manifests, finished water stock deduction, and distributor gate pass logistics."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Dispatch' },
          ]}
          secondaryActions={[
            {
              label: 'Stock Out Log',
              href: '/store/stock-out',
              icon: <Package className="w-4 h-4" />,
            },
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
                  placeholder="Search by Dispatch #, Distributor, Product, or Vehicle..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Distributor Route"
                  value={destinationFilter}
                  onChange={(e) => {
                    setDestinationFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={destinationOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Dispatch Status"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
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
              data={paginatedRecords}
              loading={isLoading}
              emptyText="No dispatch orders found"
              emptyDescription="No outbound dispatches are currently logged. Click 'Stage Outbound Dispatch' to record a vehicle loading manifest."
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
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
          <form onSubmit={handleEntrySubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Distributor Destination"
                required
                value={formDistributorId}
                onChange={(e) => setFormDistributorId(e.target.value)}
                options={distributors.map((d) => ({
                  label: `${d.name} (${d.distributorCode || 'Distributor'}${d.salesArea ? ` - ${d.salesArea.name}` : ''})`,
                  value: d.id,
                }))}
              />

              <Select
                label="Product to Dispatch"
                required
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                options={products.map((p) => ({
                  label: `${p.name} (Stock: ${p.inventory?.quantity ?? 0} ${p.unit || 'Units'})`,
                  value: p.id,
                }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <Input
                label="Quantity to Load"
                required
                type="number"
                min="1"
                placeholder="0"
                value={formQuantity}
                onChange={(e) => setFormQuantity(e.target.value)}
              />

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs h-[42px]">
                <span className="text-[#64748B]">Packaging Unit:</span>
                <span className="font-bold text-[#0F4C81]">
                  {selectedProductObj?.unit || 'Units'}
                </span>
              </div>

              <Input
                label="Delivery Vehicle #"
                placeholder="e.g. MH-12-AB-9876"
                value={formVehicle}
                onChange={(e) => setFormVehicle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Gate Pass / Security Reference #"
                placeholder="e.g. GP-2026-880"
                value={formGatePass}
                onChange={(e) => setFormGatePass(e.target.value)}
              />

              <Input
                label="Dispatch Notes / Remarks"
                placeholder="e.g. Verified by Store Lead"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setIsEntryModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
              >
                {isSubmitting ? 'Processing Dispatch...' : 'Authorize Dispatch Loading'}
              </Button>
            </div>
          </form>
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
                  <span className="text-[#64748B] block">Route Zone</span>
                  <span className="font-bold text-[#172033]">{selectedDispatch.routeZone || '--'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Product & Quantity</span>
                  <span className="font-bold font-mono text-[#172033]">
                    {selectedDispatch.productName} ({selectedDispatch.quantity} {selectedDispatch.unit})
                  </span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Vehicle</span>
                  <span>{selectedDispatch.vehicleNumber || '--'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Gate Pass #</span>
                  <span>{selectedDispatch.gatePassNumber || '--'}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Store Officer</span>
                  <span>{selectedDispatch.storeOfficer}</span>
                </div>
                {selectedDispatch.notes && (
                  <div className="col-span-2">
                    <span className="text-[#64748B] block">Remarks / Notes</span>
                    <span className="text-[#172033]">{selectedDispatch.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}

