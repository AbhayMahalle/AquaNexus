import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft, CheckCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface OrderItemForm {
  productId: string;
  quantity: number;
}

export const CreateOrder: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<OrderItemForm[]>([{ productId: '', quantity: 50 }]);
  const [deliveryAddress, setDeliveryAddress] = useState('Sector 12, Industrial Hub, North Region');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      const res = await apiClient.getProducts();
      if (res.success) {
        setProducts(res.data);
        if (res.data.length > 0) {
          setItems([{ productId: res.data[0].id, quantity: 50 }]);
        }
      }
    }
    loadProducts();
  }, []);

  const addItemRow = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 50 }]);
    }
  };

  const removeItemRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Calculations
  const calculatedItems = items.map(item => {
    const prod = products.find(p => p.id === item.productId);
    const unitPrice = prod ? prod.unitPrice : 0;
    const totalPrice = unitPrice * (item.quantity || 0);
    return { ...item, prod, unitPrice, totalPrice };
  });

  const subtotal = calculatedItems.reduce((acc, i) => acc + i.totalPrice, 0);
  const taxAmount = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validItems = items.filter(i => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      alert('Please add at least one valid product item.');
      setIsSubmitting(false);
      return;
    }

    const res = await apiClient.createOrder({
      distributorId: 'dist-01',
      distributorName: 'AquaFlow Distribution (North Zone)',
      items: validItems,
      deliveryAddress,
      notes,
    });

    setIsSubmitting(false);
    if (res.success) {
      navigate('/distributor/orders');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create New Plant Order"
        description="Select products, specify dispatch quantities, and submit order to central plant store."
        breadcrumb={['AquaNexus', 'Distributor', 'Orders', 'Create']}
        action={
          <Button variant="secondary" onClick={() => navigate('/distributor/orders')} icon={ArrowLeft}>
            Back to Orders
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Order Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Products & Quantities</CardTitle>
              <Button type="button" variant="secondary" size="sm" onClick={addItemRow} icon={Plus}>
                Add Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, idx) => {
                const prodOpts = products.map(p => ({
                  label: `${p.name} (₹${p.unitPrice}/${p.unit})`,
                  value: p.id,
                }));
                const currentCalc = calculatedItems[idx];

                return (
                  <div key={idx} className="p-4 bg-bgMain rounded-xl border border-border flex flex-col sm:flex-row items-end gap-4">
                    <div className="flex-1">
                      <Select
                        label={`Product Item #${idx + 1}`}
                        options={prodOpts}
                        value={item.productId}
                        onChange={e => updateItem(idx, 'productId', e.target.value)}
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <Input
                        label="Quantity"
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="w-full sm:w-32 text-right py-2">
                      <span className="text-xs text-textMuted block">Item Total</span>
                      <span className="text-sm font-bold text-textPrimary">{formatCurrency(currentCalc?.totalPrice || 0)}</span>
                    </div>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="p-2 text-textMuted hover:text-danger rounded-lg hover:bg-surface transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery & Dispatch Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Delivery Address"
                value={deliveryAddress}
                onChange={e => setDeliveryAddress(e.target.value)}
                placeholder="Enter authorized delivery warehouse address"
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-textSecondary uppercase tracking-wider">Special Instructions / Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional delivery timing or seal verification notes..."
                  className="h-20 px-3.5 py-2 text-sm bg-surface border border-border rounded-lg text-textPrimary placeholder:text-textMuted focus:outline-none focus:ring-2 focus:ring-secondary/40"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Side Panel */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Cost Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2.5 text-xs pb-4 border-b border-border">
                <div className="flex justify-between text-textSecondary">
                  <span>Subtotal</span>
                  <span className="font-semibold text-textPrimary">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-textSecondary">
                  <span>Estimated Tax (5% GST)</span>
                  <span className="font-semibold text-textPrimary">{formatCurrency(taxAmount)}</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-textPrimary pt-1">
                <span>Grand Total</span>
                <span className="text-xl font-extrabold text-primary">{formatCurrency(grandTotal)}</span>
              </div>
              <Button
                type="submit"
                className="w-full mt-4"
                size="lg"
                isLoading={isSubmitting}
                icon={CheckCircle}
              >
                Submit Plant Order
              </Button>
              <p className="text-[11px] text-textMuted text-center mt-2">
                Order will be routed to Central Store Manager for stock allocation & dispatch.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};
