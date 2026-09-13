import React, { useEffect, useState } from 'react';
import { Plus, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { Expense, ExpenseCategory } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AccountantExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [category, setCategory] = useState<ExpenseCategory>('UTILITIES');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadExpenses() {
      const res = await apiClient.getExpenses();
      if (res.success) setExpenses(res.data);
    }
    loadExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await apiClient.addExpense({
      category,
      description,
      amount,
      createdBy: 'Plant Accountant',
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
      setDescription('');
      setAmount(0);
      const updated = await apiClient.getExpenses();
      if (updated.success) setExpenses(updated.data);
    }
  };

  const columns: Column<Expense>[] = [
    {
      header: 'Expense #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.expenseNumber}</span>,
    },
    {
      header: 'Category',
      accessor: (row) => <span className="text-xs font-semibold text-textSecondary">{row.category.replace('_', ' ')}</span>,
    },
    {
      header: 'Description',
      accessor: (row) => <span className="font-medium text-textPrimary text-xs">{row.description}</span>,
    },
    {
      header: 'Date Logged',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatDate(row.expenseDate)}</span>,
    },
    {
      header: 'Amount',
      accessor: (row) => <span className="font-bold text-danger">-{formatCurrency(row.amount)}</span>,
    },
    {
      header: 'Logged By',
      accessor: (row) => <span className="text-xs text-textMuted">{row.createdBy}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => <Badge variant={row.status === 'APPROVED' ? 'success' : 'warning'}>{row.status}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Operational Expenses"
        description="Log and monitor water plant operational expenditure across utilities, raw materials, fuel, and maintenance."
        breadcrumb={['AquaNexus', 'Accountant', 'Expenses']}
        action={
          <Button onClick={() => setIsModalOpen(true)} icon={Plus}>
            Log New Expense
          </Button>
        }
      />

      <Table columns={columns} data={expenses} searchPlaceholder="Search plant expenses..." />

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Plant Operational Expense"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Select
            label="Expense Category"
            options={[
              { label: 'Electricity & Water Utilities', value: 'UTILITIES' },
              { label: 'Purification & Bottling Raw Materials', value: 'RAW_MATERIAL' },
              { label: 'Delivery Fleet Fuel & Logistics', value: 'FUEL_TRANSPORT' },
              { label: 'Machinery Maintenance & Repair', value: 'MAINTENANCE' },
              { label: 'Other Operational Expenses', value: 'OTHER' },
            ]}
            value={category}
            onChange={e => setCategory(e.target.value as any)}
          />
          <Input
            label="Expense Amount (₹)"
            type="number"
            min="1"
            value={amount}
            onChange={e => setAmount(parseFloat(e.target.value) || 0)}
            required
          />
          <Input
            label="Detailed Description"
            placeholder="e.g. State Power Board September Electricity Bill"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} icon={Receipt}>
              Save Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
