import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { productionService, PLANT_PRODUCTS } from '../../services/productionService';
import { employeeService } from '../../services/employeeService';
import type { Product, Employee, ProductionStatus } from '../../types';

export const CreateProductionPage: React.FC = () => {
  const navigate = useNavigate();
  const [products] = useState<Product[]>(PLANT_PRODUCTS);
  const [supervisors, setSupervisors] = useState<Employee[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    productId: PLANT_PRODUCTS[0].productId,
    quantityProduced: 1000,
    productionDate: new Date().toISOString().split('T')[0],
    shift: 'MORNING' as 'MORNING' | 'AFTERNOON' | 'NIGHT',
    supervisor: 'Suresh Kumar',
    status: 'IN_PROGRESS' as ProductionStatus,
    notes: '',
  });

  useEffect(() => {
    employeeService.getEmployees({ department: 'Production' }).then((res) => {
      if (res.success && res.data.length > 0) {
        setSupervisors(res.data);
        setFormData((prev) => ({ ...prev, supervisor: res.data[0].name }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.quantityProduced <= 0) {
      setErrorMsg('Production quantity must be greater than zero.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    const selectedProd = products.find((p) => p.productId === formData.productId);
    if (!selectedProd) return;

    const res = await productionService.createProductionBatch({
      productId: selectedProd.productId,
      productName: selectedProd.name,
      quantityProduced: Number(formData.quantityProduced),
      unit: selectedProd.unit,
      productionDate: formData.productionDate,
      shift: formData.shift,
      supervisor: formData.supervisor,
      status: formData.status,
      notes: formData.notes,
    });

    setIsSubmitting(false);

    if (res.success) {
      navigate('/production');
    } else {
      setErrorMsg(res.message || 'Failed to create production batch');
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Production Batch"
        description="Schedule a new water purification and bottling production run."
        breadcrumbs={[
          { label: 'Production', href: '/production' },
          { label: 'Create Batch' },
        ]}
        action={
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/production')}
          >
            Cancel
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-status-danger text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Select Product"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              options={products.map((p) => ({
                value: p.productId,
                label: `${p.name} (${p.unit})`,
              }))}
            />

            <Input
              label="Target Output Quantity"
              type="number"
              value={formData.quantityProduced}
              onChange={(e) => setFormData({ ...formData, quantityProduced: Number(e.target.value) })}
              required
            />

            <Input
              label="Production Date"
              type="date"
              value={formData.productionDate}
              onChange={(e) => setFormData({ ...formData, productionDate: e.target.value })}
              required
            />

            <Select
              label="Operational Shift"
              value={formData.shift}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
              options={[
                { value: 'MORNING', label: 'Morning Shift (08:00 - 16:00)' },
                { value: 'AFTERNOON', label: 'Afternoon Shift (16:00 - 00:00)' },
                { value: 'NIGHT', label: 'Night Shift (00:00 - 08:00)' },
              ]}
            />

            <Select
              label="Shift Supervisor"
              value={formData.supervisor}
              onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
              options={
                supervisors.length > 0
                  ? supervisors.map((s) => ({ value: s.name, label: `${s.name} (${s.designation})` }))
                  : [{ value: 'Suresh Kumar', label: 'Suresh Kumar (Plant Operator)' }]
              }
            />

            <Select
              label="Initial Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProductionStatus })}
              options={[
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'PENDING', label: 'Pending Start' },
                { value: 'COMPLETED', label: 'Completed' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Production & Quality Control Notes
            </label>
            <textarea
              rows={3}
              placeholder="RO pressure, TDS levels, lab sample verification notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="secondary" onClick={() => navigate('/production')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              icon={<Save className="w-4 h-4" />}
            >
              Start Production Batch
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
