import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Search, Plus, ShoppingCart } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { distributorService } from '@/services/distributorService';
import { Product } from '@/types/distributor';
import { formatCurrency } from '@/lib/utils';

export const DistributorProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    const res = await distributorService.getProducts();
    if (res.success && res.data) {
      setProducts(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <PageHeader
        title="Available Products"
        description="Browse plant products authorized for distribution in your sales area."
        action={
          <Link to="/distributor/orders/create">
            <Button icon={<ShoppingCart className="w-4 h-4" />}>Place Restock Order</Button>
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="Search by product name or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={loadProducts} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState title="No products found" description="No available products match your search criteria." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="p-2.5 bg-[#0F4C81]/10 text-[#0F4C81] rounded-lg">
                    <Package className="w-5 h-5" />
                  </div>
                  <Badge status={product.status} />
                </div>
                <h3 className="font-bold text-base text-[#172033]">{product.name}</h3>
                <p className="text-xs text-[#64748B] mt-0.5">SKU: {product.sku} • Category: {product.category}</p>
                <div className="mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="text-xs text-[#64748B]">Price / Unit</span>
                    <p className="text-lg font-bold text-[#0F4C81]">{formatCurrency(product.pricePerUnit)} <span className="text-xs font-normal text-[#64748B]">/ {product.unit}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-[#64748B]">Plant Stock</span>
                    <p className="text-sm font-semibold text-[#172033]">{product.availableStock} {product.unit}s</p>
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-3">
                <Link to={`/distributor/orders/create?productId=${product.id}`} className="w-full block">
                  <Button
                    variant="secondary"
                    className="w-full"
                    disabled={product.status === 'OUT_OF_STOCK'}
                    icon={<Plus className="w-4 h-4" />}
                  >
                    Add to Order
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};
