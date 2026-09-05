import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, Column } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  Package,
  Search,
  Plus,
  ArrowUpFromLine,
  ChevronRight,
  Clock,
  FilterX
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number | string;
  unit: string;
  minThreshold: number | string;
  status: 'optimal' | 'low' | 'critical' | 'out_of_stock';
  lastMovement?: string;
  location?: string;
}

export default function InventoryListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Table columns definition with typed renderers
  const columns: Column<InventoryItem>[] = [
    {
      key: 'name',
      header: 'Product / Item Name',
      render: (r) => (
        <div>
          <span className="font-bold text-[#172033] block">{r.name}</span>
          {r.location && <span className="text-[11px] text-[#64748B]">Bin: {r.location}</span>}
        </div>
      )
    },
    {
      key: 'sku',
      header: 'SKU / Code',
      render: (r) => <span className="font-mono font-bold text-xs text-[#0F4C81]">{r.sku}</span>
    },
    {
      key: 'category',
      header: 'Category',
      render: (r) => <span className="text-xs text-[#64748B]">{r.category}</span>
    },
    {
      key: 'quantity',
      header: 'Current Stock',
      render: (r) => (
        <span className="font-mono font-bold text-xs text-[#172033]">
          {r.quantity} {r.unit}
        </span>
      )
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (r) => <span className="text-xs text-[#64748B]">{r.unit}</span>
    },
    {
      key: 'status',
      header: 'Stock Status',
      render: (r) => {
        const statusConfigs: Record<string, { variant: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
          optimal: { variant: 'success', label: 'OPTIMAL' },
          low: { variant: 'warning', label: 'LOW STOCK' },
          critical: { variant: 'danger', label: 'CRITICAL' },
          out_of_stock: { variant: 'danger', label: 'OUT OF STOCK' },
        };
        const config = statusConfigs[r.status] || { variant: 'neutral', label: r.status };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'lastMovement',
      header: 'Last Movement',
      render: (r) => (
        <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{r.lastMovement || '--'}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <Link to={`/store/inventory/${r.id}`}>
          <Button variant="outline" size="sm" rightIcon={<ChevronRight className="w-3.5 h-3.5" />}>
            View Details
          </Button>
        </Link>
      )
    }
  ];

  // API-ready state (empty until backend API connects)
  const inventoryItems: InventoryItem[] = [];
  const isLoading = false;
  const totalPages = 1;
  const totalItems = 0;

  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    { label: 'Raw Materials (Preforms, Resin)', value: 'raw_materials' },
    { label: 'Packaging (Caps, Sleeves, Cartons)', value: 'packaging' },
    { label: 'Water Treatment Chemicals', value: 'chemicals' },
    { label: 'Finished Water Goods (Jars, Bottles)', value: 'finished_goods' },
    { label: 'Plant Consumables & Spares', value: 'consumables' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: 'all' },
    { label: 'Optimal Stock', value: 'optimal' },
    { label: 'Low Stock Threshold', value: 'low' },
    { label: 'Critical Shortage', value: 'critical' },
    { label: 'Out of Stock', value: 'out_of_stock' },
  ];

  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header with Breadcrumbs & Inward/Outward Quick Triggers */}
        <PageHeader
          title="Inventory Items Catalog"
          description="Master inventory ledger for plant raw materials, preforms, caps, treatment chemicals, and finished water stock."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Inventory' }
          ]}
          secondaryActions={[
            {
              label: 'Issue Stock OUT',
              href: '/store/stock-out',
              icon: <ArrowUpFromLine className="w-4 h-4" />,
            }
          ]}
          primaryAction={{
            label: 'Stock IN Entry',
            href: '/store/stock-in',
            icon: <Plus className="w-4 h-4" />,
          }}
        />

        {/* Filters Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Search Inventory"
                  placeholder="Search by SKU, material name, or location..."
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
                    label="Stock Status"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    options={statusOptions}
                  />
                </div>

                {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all') && (
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

        {/* Master Inventory Catalog Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#0F4C81]" />
                  <span>Plant Inventory Items</span>
                </CardTitle>
                <CardDescription>
                  Real-time stock balance, unit classifications, and status alerts across all warehouse storage bins.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">
                  {totalItems} Items Tracked
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={inventoryItems}
              loading={isLoading}
              emptyText="No inventory items available"
              emptyDescription="Inventory catalog items will be populated from the database API. Use Stock In to record initial lot consignments."
            />

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={10}
              onPageChange={(p) => setCurrentPage(p)}
            />
          </CardContent>
        </Card>
      </DashboardLayout>
    </AuthGuard>
  );
}
