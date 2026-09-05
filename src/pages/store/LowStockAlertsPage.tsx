import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  AlertTriangle,
  Search,
  ShoppingCart,
  FilterX,
  Package,
  Boxes,
  ArrowDownToLine,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export interface LowStockItem {
  id: string;
  sku: string;
  materialName: string;
  category: string;
  currentStock: number | string;
  minThreshold: number | string;
  unit: string;
  severity: 'critical' | 'warning' | 'reorder';
  suggestedReorderQty?: number | string;
  leadTimeDays?: number;
  lastProcuredDate?: string;
}

export default function LowStockAlertsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null);

  // Requisition Form state (API-ready)
  const [formReqQty, setFormReqQty] = useState('');
  const [formUrgency, setFormUrgency] = useState('high');
  const [formNotes, setFormNotes] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  // API-ready state
  const lowStockItems: LowStockItem[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    { label: 'Raw Materials (Preforms)', value: 'raw_materials' },
    { label: 'Packaging (Caps, Sleeves)', value: 'packaging' },
    { label: 'Water Treatment Chemicals', value: 'chemicals' },
    { label: 'Finished Water Goods', value: 'finished_goods' },
  ];

  const severityOptions = [
    { label: 'All Shortage Levels', value: 'all' },
    { label: 'Critical Shortage (< 20% Min)', value: 'critical' },
    { label: 'Low Stock Warning (< Min)', value: 'warning' },
    { label: 'Reorder Point Approaching', value: 'reorder' },
  ];

  const columns: Column<LowStockItem>[] = [
    {
      key: 'sku',
      header: 'SKU Code',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.sku}</span>
    },
    {
      key: 'materialName',
      header: 'Product / Material',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.materialName}</span>
          <span className="text-[11px] text-[#64748B]">{r.category}</span>
        </div>
      )
    },
    {
      key: 'currentStock',
      header: 'Current Stock',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#DC2626]">
          {r.currentStock} {r.unit}
        </span>
      )
    },
    {
      key: 'minThreshold',
      header: 'Safety Threshold',
      render: (r) => (
        <span className="font-mono text-xs text-[#64748B]">
          {r.minThreshold} {r.unit}
        </span>
      )
    },
    {
      key: 'severity',
      header: 'Severity',
      render: (r) => {
        const sevMap: Record<string, { variant: 'danger' | 'warning' | 'info'; label: string }> = {
          critical: { variant: 'danger', label: 'CRITICAL' },
          warning: { variant: 'warning', label: 'LOW STOCK' },
          reorder: { variant: 'info', label: 'REORDER DUE' },
        };
        const config = sevMap[r.severity] || { variant: 'warning', label: r.severity };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedItem(r);
              setIsRequisitionModalOpen(true);
            }}
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
          >
            Requisition
          </Button>

          <Link to={`/store/inventory/${r.id}`}>
            <Button variant="ghost" size="sm">
              <ExternalLink className="w-3.5 h-3.5 text-[#64748B]" />
            </Button>
          </Link>
        </div>
      )
    }
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSeverityFilter('all');
    setCurrentPage(1);
  };

  const handleRequisitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedMessage(true);
    setTimeout(() => {
      setSubmittedMessage(false);
      setIsRequisitionModalOpen(false);
      setFormReqQty('');
      setFormNotes('');
      setSelectedItem(null);
    }, 1200);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Low Stock & Reorder Alerts"
          description="Automated warehouse threshold monitors, shortage triggers, and purchase replenishment requisition initiator."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Low Stock Alerts' }
          ]}
          secondaryActions={[
            {
              label: 'Inventory Catalog',
              href: '/store/inventory',
              icon: <Boxes className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Receive Inward Stock',
            href: '/store/stock-in',
            icon: <ArrowDownToLine className="w-4 h-4" />,
          }}
        />

        {/* Search & Filter Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Search Low Stock Items"
                  placeholder="Search by SKU or material name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Category Filter"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={categoryOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Shortage Severity"
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    options={severityOptions}
                  />
                </div>

                {(searchQuery || categoryFilter !== 'all' || severityFilter !== 'all') && (
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

        {/* Low Stock Alerts Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#D97706]" />
                  <span>Safety Threshold Monitor</span>
                </CardTitle>
                <CardDescription>
                  Real-time indicators showing inventory levels against dynamic reorder thresholds.
                </CardDescription>
              </div>

              <Badge variant="warning" size="sm">
                Threshold Monitor Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={lowStockItems}
              loading={isLoading}
              emptyText="No critical stock shortages"
              emptyDescription="All raw materials and finished water goods are currently above their configured minimum safety stock thresholds."
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

        {/* Modal: Create Purchase Requisition */}
        <Modal
          isOpen={isRequisitionModalOpen}
          onClose={() => setIsRequisitionModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#0F4C81]" />
              <span>Initiate Stock Purchase Requisition</span>
            </div>
          }
          description="Send replenishment request to procurement for materials below safety levels."
          size="lg"
        >
          {submittedMessage ? (
            <div className="p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-[#172033]">Purchase Requisition Staged</h4>
              <p className="text-xs text-[#64748B]">Replenishment payload prepared for procurement API approval workflow.</p>
            </div>
          ) : (
            <form onSubmit={handleRequisitionSubmit} className="space-y-4">
              {selectedItem && (
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#64748B] block">Item</span>
                    <span className="font-bold text-[#172033]">{selectedItem.materialName}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Current Balance</span>
                    <span className="font-mono font-bold text-[#DC2626]">{selectedItem.currentStock} {selectedItem.unit}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block">Safety Threshold</span>
                    <span className="font-mono font-bold text-[#172033]">{selectedItem.minThreshold} {selectedItem.unit}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Requisition Order Quantity"
                  required
                  type="number"
                  placeholder="e.g. 50000"
                  value={formReqQty}
                  onChange={(e) => setFormReqQty(e.target.value)}
                />

                <Select
                  label="Procurement Urgency"
                  required
                  value={formUrgency}
                  onChange={(e) => setFormUrgency(e.target.value)}
                  options={[
                    { label: 'High — Immediate Dispatch Required', value: 'high' },
                    { label: 'Medium — Standard Lead Time Reorder', value: 'medium' },
                    { label: 'Low — Buffer Stock Build-up', value: 'low' },
                  ]}
                />
              </div>

              <div>
                <Input
                  label="Requisition Justification & Supplier Notes"
                  placeholder="e.g. Estimated 3-day buffer remaining for 1L bottling run"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button variant="outline" size="sm" onClick={() => setIsRequisitionModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" leftIcon={<ShoppingCart className="w-4 h-4" />}>
                  Submit Requisition Order
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
