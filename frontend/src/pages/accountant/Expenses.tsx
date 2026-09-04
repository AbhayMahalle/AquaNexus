import React, { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { accountantService } from '@/services/accountantService';
import { ExpenseRecord } from '@/types/accountant';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AccountantExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<any>('UTILITIES');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    setError(null);
    const res = await accountantService.getExpenses();
    if (res.success && res.data) {
      setExpenses(res.data);
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setSubmitting(true);
    const res = await accountantService.createExpense({
      category,
      description,
      amount: parseFloat(amount),
    });

    setSubmitting(false);
    if (res.success) {
      setIsModalOpen(false);
      setDescription('');
      setAmount('');
      loadExpenses();
    }
  };

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.expenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      exp.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || exp.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <DashboardLayout>
      <PageHeader
        title="Plant Expenses Management"
        description="Record and track operational costs including utilities, fleet maintenance, and raw materials."
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
            Record New Expense
          </Button>
        }
      />

      {/* Filter Bar */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              label="Expense Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { label: 'All Categories', value: 'ALL' },
                { label: 'Utilities', value: 'UTILITIES' },
                { label: 'Maintenance', value: 'MAINTENANCE' },
                { label: 'Logistics', value: 'LOGISTICS' },
                { label: 'Raw Materials', value: 'RAW_MATERIALS' },
                { label: 'Salaries', value: 'SALARIES' },
                { label: 'Other', value: 'OTHER' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Expenses Table */}
      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message={error} onRetry={loadExpenses} />
      ) : (
        <Table<ExpenseRecord>
          data={filteredExpenses}
          keyExtractor={(item) => item.id}
          columns={[
            { header: 'Expense Ref', accessorKey: 'expenseNumber', className: 'font-semibold text-[#0F4C81]' },
            { header: 'Category', accessorKey: 'category', className: 'text-xs font-semibold text-[#64748B]' },
            { header: 'Description', accessorKey: 'description', className: 'font-medium text-[#172033]' },
            { header: 'Date', cell: (row) => formatDate(row.date) },
            { header: 'Approved By', accessorKey: 'approvedBy', className: 'text-xs text-[#64748B]' },
            { header: 'Amount', cell: (row) => <span className="font-bold text-sm text-[#0F4C81]">{formatCurrency(row.amount)}</span> },
            { header: 'Status', cell: (row) => <Badge status={row.status} /> },
          ]}
        />
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Operational Expense"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddExpense} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Expense Record'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <Select
            label="Expense Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={[
              { label: 'Utilities (Electricity/Water)', value: 'UTILITIES' },
              { label: 'Plant Maintenance & Repairs', value: 'MAINTENANCE' },
              { label: 'Logistics & Transportation', value: 'LOGISTICS' },
              { label: 'Raw Materials & Packaging', value: 'RAW_MATERIALS' },
              { label: 'Salaries & Staff Welfare', value: 'SALARIES' },
              { label: 'Other Operational Expense', value: 'OTHER' },
            ]}
          />
          <Input
            label="Description"
            placeholder="e.g. RO Filter Cartridge Replacement"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <Input
            label="Amount (INR)"
            type="number"
            placeholder="e.g. 15000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </form>
      </Modal>
    </DashboardLayout>
  );
};
