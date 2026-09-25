'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Plus, Receipt, RefreshCw, TrendingDown, Building2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { Expense, ExpenseCategory } from '@/types/business';
import { formatCurrency, formatDate } from '@/lib/utils';

export const AccountantExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('UTILITIES');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [expRes, supRes] = await Promise.all([
        apiClient.getExpenses(),
        apiClient.getSuppliers(),
      ]);
      if (expRes.success) setExpenses(expRes.data);
      if (supRes.success) setSuppliers(supRes.data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setErrorMsg('Please enter a valid expense amount greater than 0');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await apiClient.addExpense({
        category,
        description: description.trim(),
        amount: Number(amount),
        createdBy: 'Plant Accountant',
        supplierId: selectedSupplierId || undefined,
      });

      if (res.success) {
        setIsModalOpen(false);
        setDescription('');
        setAmount(0);
        setSelectedSupplierId('');
        await loadData();
      } else {
        setErrorMsg(res.message || 'Failed to record expense');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Metrics
  const totalExpenditure = useMemo(() => expenses.reduce((acc, e) => acc + e.amount, 0), [expenses]);
  const approvedCount = useMemo(
    () => expenses.filter((e) => e.status === 'APPROVED' || e.status === 'PAID').length,
    [expenses]
  );
  const maxSingleExpense = useMemo(() => expenses.reduce((max, e) => Math.max(max, e.amount), 0), [expenses]);

  const filteredExpenses = useMemo(() => {
    if (categoryFilter === 'ALL') return expenses;
    return expenses.filter((e) => e.category === categoryFilter);
  }, [expenses, categoryFilter]);

  const columns: Column<Expense>[] = [
    {
      header: 'Expense #',
      accessor: (row) => <span className="font-mono text-xs font-bold text-primary">{row.expenseNumber}</span>,
    },
    {
      header: 'Category',
      accessor: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          {row.category.replace(/_/g, ' ')}
        </span>
      ),
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
      accessor: (row) => (
        <Badge variant={row.status === 'APPROVED' || row.status === 'PAID' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Operational Expenses"
        description="Live records and audit of water plant expenditure across utilities, raw materials, fuel, and machinery maintenance."
        breadcrumb={['AquaNexus', 'Accountant', 'Expenses']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadData} isLoading={isLoading} icon={RefreshCw}>
              Refresh
            </Button>
            <Button
              onClick={() => {
                setErrorMsg('');
                setIsModalOpen(true);
              }}
              icon={Plus}
            >
              Log New Expense
            </Button>
          </div>
        }
      />

      {/* Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Total Expenditure</p>
              <p className="text-xl font-bold text-danger mt-1">{formatCurrency(totalExpenditure)}</p>
              <p className="text-xs text-textSecondary mt-0.5">Across {expenses.length} expense entries</p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Total Entries</p>
              <p className="text-xl font-bold text-textPrimary mt-1">{expenses.length}</p>
              <p className="text-xs text-textSecondary mt-0.5">Logged operational records</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Settled / Approved</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Voucher certified</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Highest Voucher</p>
              <p className="text-xl font-bold text-textPrimary mt-1">{formatCurrency(maxSingleExpense)}</p>
              <p className="text-xs text-textSecondary mt-0.5">Peak single transaction</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'All Expenses', value: 'ALL' },
          { label: 'Utilities', value: 'UTILITIES' },
          { label: 'Raw Materials', value: 'RAW_MATERIAL' },
          { label: 'Fuel & Fleet', value: 'FUEL_TRANSPORT' },
          { label: 'Maintenance', value: 'MAINTENANCE' },
          { label: 'Other', value: 'OTHER' },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={categoryFilter === tab.value ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setCategoryFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Table
        columns={columns}
        data={filteredExpenses}
        isLoading={isLoading}
        searchPlaceholder="Search plant expenses..."
        emptyMessage="No operational expenses found for this category."
      />

      {/* Add Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Plant Operational Expense">
        <form onSubmit={handleAddExpense} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">{errorMsg}</div>
          )}

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
            onChange={(e) => setCategory(e.target.value as any)}
          />

          <Input
            label="Expense Amount (₹)"
            type="number"
            min="1"
            value={amount || ''}
            placeholder="e.g. 15000"
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Input
            label="Detailed Description"
            placeholder="e.g. Monthly packaging material purchase"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          {suppliers.length > 0 && (
            <Select
              label="Associated Vendor / Supplier (Optional)"
              options={[
                { label: '-- None (Direct Cash/Utility) --', value: '' },
                ...suppliers.map((s) => ({ label: `${s.name} (${s.supplierCode})`, value: s.id })),
              ]}
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting} icon={Receipt}>
              Save &amp; Record Expense
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountantExpenses;
