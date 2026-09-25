'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
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
  productId: string;
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

  // Requisition Form state
  const [formReqQty, setFormReqQty] = useState('');
  const [formUrgency, setFormUrgency] = useState('high');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any[]>('/api/inventory/low-stock');
      if (res.ok && res.data) {
        const list = Array.isArray(res.data) ? res.data : [];
        const mapped: LowStockItem[] = list.map((item: any) => {
          const qty = Number(item.quantity) || 0;
          const reorder = Number(item.reorderLevel ?? item.product?.minimumStock ?? 0);
          let severity: LowStockItem['severity'] = 'warning';
          if (reorder > 0 && qty <= reorder * 0.2) severity = 'critical';
          else if (reorder > 0 && qty <= reorder) severity = 'warning';
          else severity = 'reorder';

          return {
            id: item.id,
            productId: item.productId || item.product?.id || item.id,
            sku: item.product?.sku || '--',
            materialName: item.product?.name || 'Unknown Item',
            category: item.product?.category || 'General',
            currentStock: qty,
            minThreshold: reorder,
            unit: item.product?.unit || 'Units',
            severity,
            suggestedReorderQty: item.shortage > 0 ? item.shortage : (reorder > 0 ? reorder * 2 : 100),
            leadTimeDays: 3,
            lastProcuredDate: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '--',
          };
        });

        setLowStockItems(mapped);
      }
    } catch (err) {
      console.error('Failed to load low stock alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  const filteredLowStockItems = React.useMemo(() => {
    return lowStockItems.filter((item) => {
      // 1. Search Query: SKU / material / product / category
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.sku?.toLowerCase().includes(q) ||
          item.materialName?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'all') {
        const cat = (item.category || '').toLowerCase();
        if (categoryFilter === 'raw_materials') {
          const isRaw = cat.includes('raw') || cat.includes('preform') || cat.includes('material');
          if (!isRaw) return false;
        } else if (categoryFilter === 'packaging') {
          const isPack = cat.includes('pack') || cat.includes('cap') || cat.includes('sleeve') || cat.includes('box') || cat.includes('label');
          if (!isPack) return false;
        } else if (categoryFilter === 'chemicals') {
          const isChem = cat.includes('chem') || cat.includes('treat') || cat.includes('chlorine') || cat.includes('mineral');
          if (!isChem) return false;
        } else if (categoryFilter === 'finished_goods') {
          const isFinish = cat.includes('finish') || cat.includes('water') || cat.includes('bottle') || cat.includes('pouch') || cat.includes('good');
          if (!isFinish) return false;
        } else {
          if (!cat.includes(categoryFilter.toLowerCase())) return false;
        }
      }

      // 3. Shortage Severity Filter
      if (severityFilter !== 'all') {
        if (item.severity !== severityFilter) return false;
      }

      return true;
    });
  }, [lowStockItems, searchQuery, categoryFilter, severityFilter]);

  const totalPages = Math.ceil(filteredLowStockItems.length / 10) || 1;
  const paginatedLowStockItems = React.useMemo(() => {
    const start = (currentPage - 1) * 10;
    return filteredLowStockItems.slice(start, start + 10);
  }, [filteredLowStockItems, currentPage]);

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
              setFormReqQty(String(r.suggestedReorderQty || ''));
              setFormUrgency(r.severity === 'critical' ? 'high' : 'medium');
              setFormNotes('');
              setIsRequisitionModalOpen(true);
            }}
            leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
          >
            Requisition
          </Button>

          <Link href={`/store/inventory/${r.id}`}>
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

  const handleRequisitionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !selectedItem.productId) {
      showToast('Please select a valid product item', 'error');
      return;
    }

    const qty = parseInt(formReqQty, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid requisition quantity', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const urgencyText = formUrgency.toUpperCase();
      const notesCombined = `[Urgency: ${urgencyText}] ${formNotes.trim() ? formNotes.trim() : 'Low stock replenishment requisition'}`;

      const payload = {
        productionNumber: `REQ-${Date.now().toString().slice(-6)}`,
        batchNumber: `BATCH-${Date.now().toString().slice(-6)}`,
        productId: selectedItem.productId,
        quantity: qty,
        productionDate: new Date().toISOString(),
        status: 'PLANNED',
        remarks: notesCombined,
      };

      const res = await apiRequest<any>('/api/production', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast('Stock Purchase Requisition submitted successfully!', 'success');
        setIsRequisitionModalOpen(false);
        setFormReqQty('');
        setFormNotes('');
        setSelectedItem(null);
        await loadAlerts();
      } else {
        showToast(res.error || 'Failed to submit purchase requisition', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error submitting purchase requisition', 'error');
    } finally {
      setIsSubmitting(false);
    }
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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4" />}
                />
              </div>

              <div>
                <Select
                  label="Category Filter"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={categoryOptions}
                />
              </div>

              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    label="Shortage Severity"
                    value={severityFilter}
                    onChange={(e) => {
                      setSeverityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
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
              data={paginatedLowStockItems}
              loading={isLoading}
              emptyText="No critical stock shortages"
              emptyDescription="No inventory items match the selected filter criteria."
            />

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredLowStockItems.length}
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
                min="1"
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
                  { label: 'High - Immediate Dispatch Required', value: 'high' },
                  { label: 'Medium - Standard Lead Time Reorder', value: 'medium' },
                  { label: 'Low - Buffer Stock Build-up', value: 'low' },
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
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
                leftIcon={<ShoppingCart className="w-4 h-4" />}
              >
                {isSubmitting ? 'Submitting Requisition...' : 'Submit Requisition Order'}
              </Button>
            </div>
          </form>
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
