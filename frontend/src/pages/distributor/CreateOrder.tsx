import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { distributorService } from '@/services/distributorService';
import { Product, OrderItem } from '@/types/distributor';
import { formatCurrency } from '@/lib/utils';

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProductId = searchParams.get('productId');

  const [products, setProducts] = useState<Product[]>([]);
  const [shippingAddress, setShippingAddress] = useState('Plot 45, Industrial Zone, Area North');
  const [notes, setNotes] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const res = await distributorService.getProducts();
      if (res.success && res.data) {
        setProducts(res.data);
        if (preselectedProductId) {
          setSelectedItems([{ productId: preselectedProductId, quantity: 10 }]);
        } else if (res.data.length > 0) {
          setSelectedItems([{ productId: res.data[0].id, quantity: 20 }]);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [preselectedProductId]);

  const addItemRow = () => {
    if (products.length > 0) {
      setSelectedItems([...selectedItems, { productId: products[0].id, quantity: 10 }]);
    }
  };

  const removeItemRow = (index: number) => {
    const next = [...selectedItems];
    next.splice(index, 1);
    setSelectedItems(next);
  };

  const updateItem = (index: number, field: 'productId' | 'quantity', value: any) => {
    const next = [...selectedItems];
    next[index] = { ...next[index], [field]: value };
    setSelectedItems(next);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      const price = prod ? prod.pricePerUnit : 0;
      return sum + price * (item.quantity || 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) return;

    setSubmitting(true);
    const orderItems: OrderItem[] = selectedItems.map((item, idx) => {
      const prod = products.find((p) => p.id === item.productId);
      return {
        id: `item-${idx}`,
        productId: item.productId,
        productName: prod ? prod.name : 'Unknown Product',
        quantity: Number(item.quantity),
        unitPrice: prod ? prod.pricePerUnit : 0,
        totalPrice: (prod ? prod.pricePerUnit : 0) * Number(item.quantity),
      };
    });

    const res = await distributorService.createOrder({
      shippingAddress,
      notes,
      totalAmount: calculateTotal(),
      items: orderItems,
    });

    setSubmitting(false);
    if (res.success) {
      navigate('/distributor/orders');
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Create Restock Order"
        description="Submit a new product restock order to the central plant."
        action={
          <Link to="/distributor/orders">
            <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
              Back to Orders
            </Button>
          </Link>
        }
      />

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Shipping & Delivery Details */}
          <Card>
            <h3 className="font-semibold text-base text-[#172033] mb-4 pb-2 border-b border-[#E2E8F0]">
              Delivery & Shipping Info
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Delivery Address"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
              />
              <Input
                label="Order Notes / Instructions (Optional)"
                placeholder="e.g. Deliver before 12 PM"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </Card>

          {/* Order Items selection */}
          <Card>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E8F0]">
              <h3 className="font-semibold text-base text-[#172033]">Order Items</h3>
              <Button type="button" variant="secondary" size="sm" onClick={addItemRow} icon={<Plus className="w-4 h-4" />}>
                Add Product Row
              </Button>
            </div>

            <div className="space-y-3">
              {selectedItems.map((item, index) => {
                const currentProd = products.find((p) => p.id === item.productId);
                const lineTotal = (currentProd ? currentProd.pricePerUnit : 0) * (item.quantity || 0);

                return (
                  <div key={index} className="flex flex-col sm:flex-row items-end gap-3 p-3 bg-[#F5F8FB] rounded-[8px] border border-[#E2E8F0]">
                    <div className="flex-1 w-full">
                      <Select
                        label="Select Product"
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        options={products.map((p) => ({
                          label: `${p.name} (${formatCurrency(p.pricePerUnit)} / ${p.unit})`,
                          value: p.id,
                        }))}
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                      />
                    </div>
                    <div className="w-full sm:w-36 text-right pb-2 font-semibold text-sm text-[#0F4C81]">
                      {formatCurrency(lineTotal)}
                    </div>
                    <div className="pb-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItemRow(index)}
                        disabled={selectedItems.length <= 1}
                        icon={<Trash2 className="w-4 h-4 text-[#DC2626]" />}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grand Total Summary */}
            <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between bg-white">
              <span className="text-base font-semibold text-[#172033]">Estimated Order Total</span>
              <span className="text-2xl font-bold text-[#0F4C81]">{formatCurrency(calculateTotal())}</span>
            </div>
          </Card>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3">
            <Link to="/distributor/orders">
              <Button variant="secondary" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={submitting || selectedItems.length === 0} icon={<ShoppingCart className="w-4 h-4" />}>
              {submitting ? 'Submitting Order...' : 'Submit Restock Order'}
            </Button>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
};
