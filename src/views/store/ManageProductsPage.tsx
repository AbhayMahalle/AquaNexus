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
  Boxes,
  Plus,
  Search,
  FilterX,
  Edit2,
  Trash2,
  Package,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  DollarSign,
  Tag,
  Eye,
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  sellingPrice: number | string;
  costPrice: number | string;
  minimumStock: number;
  status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  inventory?: {
    id: string;
    quantity: number;
    reservedQuantity: number;
    reorderLevel: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ManageProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductItem | null>(null);

  // Form states
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Finished Goods');
  const [formUnit, setFormUnit] = useState('Bottle');
  const [formSellingPrice, setFormSellingPrice] = useState('');
  const [formCostPrice, setFormCostPrice] = useState('');
  const [formMinimumStock, setFormMinimumStock] = useState('10');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'>('ACTIVE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load products from live backend API
  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<any>('/api/products?limit=200');
      if (res.ok && res.data) {
        const list = res.data.products || (Array.isArray(res.data) ? res.data : res.data.data || []);
        setProducts(list);
      } else {
        showToast(res.error || 'Failed to fetch products from server', 'error');
      }
    } catch (err: any) {
      console.error('Failed to load products:', err);
      showToast('Error connecting to backend products API', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset form
  const resetForm = () => {
    setFormSku('');
    setFormName('');
    setFormDescription('');
    setFormCategory('Finished Goods');
    setFormUnit('Bottle');
    setFormSellingPrice('');
    setFormCostPrice('');
    setFormMinimumStock('10');
    setFormStatus('ACTIVE');
  };

  const handleOpenAddModal = () => {
    resetForm();
    // Auto-generate suggested SKU
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFormSku(`PRD-${randomSuffix}`);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setFormSku(product.sku || '');
    setFormName(product.name || '');
    setFormDescription(product.description || '');
    setFormCategory(product.category || 'Finished Goods');
    setFormUnit(product.unit || 'Bottle');
    setFormSellingPrice(String(product.sellingPrice ?? '0'));
    setFormCostPrice(String(product.costPrice ?? '0'));
    setFormMinimumStock(String(product.minimumStock ?? '0'));
    setFormStatus(product.status || 'ACTIVE');
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (product: ProductItem) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  // Create Product Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim() || !formSellingPrice || !formCostPrice) {
      showToast('SKU, Name, Selling Price, and Cost Price are required', 'error');
      return;
    }

    const sPrice = parseFloat(formSellingPrice);
    const cPrice = parseFloat(formCostPrice);
    const minStock = parseInt(formMinimumStock, 10);

    if (isNaN(sPrice) || sPrice < 0 || isNaN(cPrice) || cPrice < 0) {
      showToast('Prices must be non-negative numbers', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: formSku.trim(),
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          category: formCategory.trim(),
          unit: formUnit.trim(),
          sellingPrice: sPrice,
          costPrice: cPrice,
          minimumStock: isNaN(minStock) ? 0 : minStock,
          status: formStatus
        })
      });

      if (res.ok) {
        showToast('Product created successfully and added to catalog!', 'success');
        setIsAddModalOpen(false);
        resetForm();
        loadProducts();
      } else {
        showToast(res.error || 'Failed to create product', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error creating product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Product Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!formName.trim() || !formSellingPrice || !formCostPrice) {
      showToast('Name, Selling Price, and Cost Price are required', 'error');
      return;
    }

    const sPrice = parseFloat(formSellingPrice);
    const cPrice = parseFloat(formCostPrice);
    const minStock = parseInt(formMinimumStock, 10);

    if (isNaN(sPrice) || sPrice < 0 || isNaN(cPrice) || cPrice < 0) {
      showToast('Prices must be non-negative numbers', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>(`/api/products/${selectedProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          category: formCategory.trim(),
          unit: formUnit.trim(),
          sellingPrice: sPrice,
          costPrice: cPrice,
          minimumStock: isNaN(minStock) ? 0 : minStock,
          status: formStatus
        })
      });

      if (res.ok) {
        showToast('Product updated successfully!', 'success');
        setIsEditModalOpen(false);
        setSelectedProduct(null);
        loadProducts();
      } else {
        showToast(res.error || 'Failed to update product', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete / Deactivate Submit
  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>(`/api/products/${selectedProduct.id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        const action = res.data?.action;
        if (action === 'DEACTIVATED') {
          showToast(res.data?.message || 'Product is referenced in existing records and was safely deactivated (status: INACTIVE).', 'info');
        } else {
          showToast('Product permanently deleted successfully.', 'success');
        }
        setIsDeleteModalOpen(false);
        setSelectedProduct(null);
        loadProducts();
      } else {
        showToast(res.error || 'Failed to delete or deactivate product', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesSku = p.sku?.toLowerCase().includes(query);
        const matchesCategory = p.category?.toLowerCase().includes(query);
        const matchesDesc = p.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesCategory && !matchesDesc) {
          return false;
        }
      }

      if (categoryFilter !== 'all' && p.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      if (statusFilter !== 'all' && p.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  // Pagination calculation
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Aggregate catalog statistics
  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.status === 'ACTIVE').length;
    const inactive = products.filter((p) => p.status === 'INACTIVE' || p.status === 'DISCONTINUED').length;
    const lowStock = products.filter((p) => {
      const qty = p.inventory?.quantity ?? 0;
      const min = p.minimumStock ?? 0;
      return qty <= min;
    }).length;
    const categories = new Set(products.map((p) => p.category).filter(Boolean)).size;

    return { total, active, inactive, lowStock, categories };
  }, [products]);

  // Unique category options for filter
  const categoryOptions = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return [
      { label: 'All Categories', value: 'all' },
      ...list.map((c) => ({ label: c, value: c }))
    ];
  }, [products]);

  const columns: Column<ProductItem>[] = [
    {
      key: 'sku',
      header: 'SKU / Code',
      render: (p) => (
        <span className="font-mono text-xs font-bold text-[#0F4C81] bg-[#F0F7FF] px-2 py-0.5 rounded border border-[#BAE6FD]">
          {p.sku}
        </span>
      )
    },
    {
      key: 'name',
      header: 'Product Name',
      render: (p) => (
        <div>
          <div className="font-semibold text-xs text-[#172033]">{p.name}</div>
          {p.description && (
            <div className="text-[11px] text-[#64748B] truncate max-w-xs">{p.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => (
        <Badge variant="secondary" size="sm">
          {p.category || 'Standard'}
        </Badge>
      )
    },
    {
      key: 'unit',
      header: 'Unit',
      render: (p) => <span className="text-xs text-[#64748B]">{p.unit || 'Unit'}</span>
    },
    {
      key: 'stock',
      header: 'Available Stock',
      render: (p) => {
        const qty = p.inventory?.quantity ?? 0;
        const min = p.minimumStock ?? 0;
        const isLow = qty <= min;
        return (
          <div className="flex items-center gap-1.5">
            <span className={`font-mono font-bold text-xs ${isLow ? 'text-[#DC2626]' : 'text-[#16A34A]'}`}>
              {qty} {p.unit}
            </span>
            {isLow && (
              <span className="inline-flex items-center text-[10px] bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] px-1.5 py-0.5 rounded font-semibold">
                Low (&le;{min})
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'prices',
      header: 'Rate (Cost / Sell)',
      render: (p) => (
        <div className="text-xs">
          <span className="text-[#64748B]">₹{Number(p.costPrice).toFixed(2)}</span>
          <span className="mx-1 text-[#CBD5E1]">/</span>
          <span className="font-bold text-[#172033]">₹{Number(p.sellingPrice).toFixed(2)}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => {
        const map: Record<string, { variant: 'success' | 'neutral' | 'danger'; label: string }> = {
          ACTIVE: { variant: 'success', label: 'ACTIVE' },
          INACTIVE: { variant: 'neutral', label: 'INACTIVE' },
          DISCONTINUED: { variant: 'danger', label: 'DISCONTINUED' }
        };
        const config = map[p.status] || { variant: 'neutral', label: p.status };
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenEditModal(p)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-[#DC2626] hover:bg-[#FEF2F2]"
            onClick={() => handleOpenDeleteModal(p)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Remove
          </Button>
        </div>
      )
    }
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'manager', 'store_manager']}>
      <DashboardLayout>
        {/* Page Header */}
        <PageHeader
          title="Product Management & Catalog"
          description="Maintain master products, packaging materials, container sizes, and unit rate cards connected to live inventory."
          breadcrumbs={[
            { label: 'Store', href: '/store/dashboard' },
            { label: 'Manage Products' }
          ]}
          secondaryActions={[
            {
              label: 'Store Inventory',
              href: '/store/inventory',
              icon: <Package className="w-4 h-4" />
            },
            {
              label: 'Stock Inward',
              href: '/store/stock-in',
              icon: <Boxes className="w-4 h-4" />
            }
          ]}
          primaryAction={{
            label: 'Add New Product',
            icon: <Plus className="w-4 h-4" />,
            onClick: handleOpenAddModal
          }}
        />

        {/* Live Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-l-4 border-l-[#0F4C81]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B]">Total Catalog Items</p>
                <p className="text-2xl font-bold text-[#172033] mt-1">{stats.total}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Across all product lines</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F0F7FF] flex items-center justify-center text-[#0F4C81]">
                <Boxes className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#16A34A]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B]">Active For Sale / Production</p>
                <p className="text-2xl font-bold text-[#16A34A] mt-1">{stats.active}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Ready for orders & dispatch</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#DC2626]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B]">Low Stock Warnings</p>
                <p className="text-2xl font-bold text-[#DC2626] mt-1">{stats.lowStock}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">At or below reorder level</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] flex items-center justify-center text-[#DC2626]">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#8B5CF6]">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#64748B]">Product Categories</p>
                <p className="text-2xl font-bold text-[#8B5CF6] mt-1">{stats.categories}</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Active groups</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center text-[#8B5CF6]">
                <Layers className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter Toolbar */}
        <Card className="mb-6">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <Input
                  label="Search Products"
                  placeholder="Search by Name, SKU, Category, or description..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />}
                />
              </div>

              <div>
                <Select
                  label="Filter by Category"
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={categoryOptions}
                />
              </div>

              <div>
                <Select
                  label="Filter by Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { label: 'All Statuses', value: 'all' },
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Inactive', value: 'INACTIVE' },
                    { label: 'Discontinued', value: 'DISCONTINUED' }
                  ]}
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E2E8F0]">
              <span className="text-xs text-[#64748B]">
                Showing <strong className="text-[#172033]">{filteredProducts.length}</strong> products matching filters
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  leftIcon={<FilterX className="w-3.5 h-3.5" />}
                >
                  Clear Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadProducts}
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Ledger Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-[#0F4C81]" />
                  <span>Master Product Catalog</span>
                </CardTitle>
                <CardDescription>
                  All products synced with PostgreSQL database and live store inventory balances.
                </CardDescription>
              </div>
              <Badge variant="primary" size="sm">
                Live DB
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table
              columns={columns}
              data={paginatedProducts}
              loading={isLoading}
              emptyText="No products found"
              emptyDescription="No products match the selected filters. Click 'Add New Product' to register a new item in your catalog."
            />
            {totalPages > 1 && (
              <div className="p-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-xs text-[#64748B]">
                  Page {currentPage} of {totalPages}
                </span>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Add Product */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#0F4C81]" />
              <span>Create New Product</span>
            </div>
          }
          description="Register a new manufactured product, bottle, packaging material, or inventory item."
          size="lg"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="SKU / Item Code"
                required
                placeholder="e.g. PRD-20L-JAR"
                value={formSku}
                onChange={(e) => setFormSku(e.target.value)}
              />

              <Input
                label="Product Name"
                required
                placeholder="e.g. 20L Purified Water Jar"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Product Category
                </label>
                <input
                  type="text"
                  list="category-suggestions"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  placeholder="e.g. 20L Jars, 1L Bottles, Raw Materials"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  required
                />
                <datalist id="category-suggestions">
                  <option value="20L Jars" />
                  <option value="1L Packaged Water" />
                  <option value="500ml Bottled Water" />
                  <option value="Caps & Closures" />
                  <option value="Preforms" />
                  <option value="Water Treatment Chemicals" />
                  <option value="Finished Goods" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Unit of Measurement
                </label>
                <input
                  type="text"
                  list="unit-suggestions"
                  className="w-full px-3 py-2 text-xs border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F4C81]"
                  placeholder="e.g. Jar, Bottle, Carton, Box, Kg, Liter"
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                  required
                />
                <datalist id="unit-suggestions">
                  <option value="Jar" />
                  <option value="Bottle" />
                  <option value="Carton" />
                  <option value="Box" />
                  <option value="Piece" />
                  <option value="Kg" />
                  <option value="Liter" />
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Cost Price (₹)"
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formCostPrice}
                onChange={(e) => setFormCostPrice(e.target.value)}
                leftIcon={<DollarSign className="w-3.5 h-3.5 text-[#64748B]" />}
              />

              <Input
                label="Selling Price (₹)"
                required
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formSellingPrice}
                onChange={(e) => setFormSellingPrice(e.target.value)}
                leftIcon={<DollarSign className="w-3.5 h-3.5 text-[#64748B]" />}
              />

              <Input
                label="Minimum Stock Alert"
                type="number"
                placeholder="10"
                value={formMinimumStock}
                onChange={(e) => setFormMinimumStock(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Product Status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                options={[
                  { label: 'Active (Available for transactions)', value: 'ACTIVE' },
                  { label: 'Inactive (Paused)', value: 'INACTIVE' },
                  { label: 'Discontinued (Archived)', value: 'DISCONTINUED' }
                ]}
              />

              <Input
                label="Description / Specifications"
                placeholder="e.g. Food-grade PET jar with tamper-proof seal"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center gap-2 text-xs text-[#166534]">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
              <span>Creating this product will automatically initialize an inventory balance record with 0 stock.</span>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Edit Product */}
        {selectedProduct && (
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedProduct(null);
            }}
            title={
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#0F4C81]" />
                <span>Edit Product: {selectedProduct.sku}</span>
              </div>
            }
            description="Update product details, pricing, categories, and minimum threshold."
            size="lg"
          >
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="SKU / Item Code"
                  disabled
                  value={formSku}
                  helperText="SKU cannot be changed after creation to maintain ledger consistency"
                />

                <Input
                  label="Product Name"
                  required
                  placeholder="e.g. 20L Purified Water Jar"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Category"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                />

                <Input
                  label="Unit"
                  required
                  value={formUnit}
                  onChange={(e) => setFormUnit(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Cost Price (₹)"
                  required
                  type="number"
                  step="0.01"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(e.target.value)}
                />

                <Input
                  label="Selling Price (₹)"
                  required
                  type="number"
                  step="0.01"
                  value={formSellingPrice}
                  onChange={(e) => setFormSellingPrice(e.target.value)}
                />

                <Input
                  label="Minimum Stock Alert"
                  type="number"
                  value={formMinimumStock}
                  onChange={(e) => setFormMinimumStock(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Product Status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  options={[
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Inactive', value: 'INACTIVE' },
                    { label: 'Discontinued', value: 'DISCONTINUED' }
                  ]}
                />

                <Input
                  label="Description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#E2E8F0]">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmitting}
                  leftIcon={<Edit2 className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Modal>
        )}

        {/* Modal: Delete / Deactivate Product Confirmation */}
        {selectedProduct && (
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedProduct(null);
            }}
            title={
              <div className="flex items-center gap-2 text-[#DC2626]">
                <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                <span>Remove or Deactivate Product</span>
              </div>
            }
            description="Confirmation required before removing product from active catalog."
            footer={
              <div className="flex justify-end gap-3 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedProduct(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleDeleteSubmit}
                  leftIcon={<Trash2 className="w-4 h-4" />}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Remove'}
                </Button>
              </div>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[#991B1B]">
                <p className="font-bold">Are you sure you want to remove this product?</p>
                <p className="mt-1">
                  <strong>{selectedProduct.name}</strong> (SKU: {selectedProduct.sku})
                </p>
                <p className="mt-2 text-[11px] text-[#B91C1C]">
                  Current on-hand inventory: <strong>{selectedProduct.inventory?.quantity ?? 0} {selectedProduct.unit}</strong>
                </p>
              </div>

              <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#64748B] space-y-1">
                <p className="font-semibold text-[#172033]">Data Integrity Protection:</p>
                <p>
                  • If this product has existing stock (&gt;0), past stock movements, purchase orders, or sales, it will be <strong>safely deactivated (Status: INACTIVE)</strong> instead of breaking existing database foreign keys.
                </p>
                <p>
                  • If it has never been used in any transactions, it will be permanently deleted.
                </p>
              </div>
            </div>
          </Modal>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
