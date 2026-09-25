'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { CheckCircle2, DollarSign, Plus, RefreshCw, AlertCircle, Clock, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { apiClient } from '@/lib/api-client';
import { PayrollRecord } from '@/types/business';
import { formatCurrency } from '@/lib/utils';

export const AccountantPayroll: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  // Payout Modal
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // New Payroll Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [payPeriodEnd, setPayPeriodEnd] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  );
  const [basicSalary, setBasicSalary] = useState<number>(25000);
  const [overtimeAmount, setOvertimeAmount] = useState<number>(0);
  const [deductions, setDeductions] = useState<number>(0);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        apiClient.getPayroll(),
        apiClient.getEmployees(),
      ]);

      if (payRes.success) setPayroll(payRes.data);
      if (empRes.success && empRes.data.length > 0) {
        setEmployees(empRes.data);
        if (!selectedEmployeeId) {
          setSelectedEmployeeId(empRes.data[0].id);
          if (empRes.data[0].salary) setBasicSalary(Number(empRes.data[0].salary));
        }
      }
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessSalary = async () => {
    if (!selectedRecord) return;
    setIsProcessing(true);

    try {
      const res = await apiClient.updatePayrollStatus(selectedRecord.id, 'PAID');
      if (res.success) {
        setSelectedRecord(null);
        await loadData();
      } else {
        alert(res.message || 'Failed to disburse salary');
      }
    } catch (err: any) {
      alert(err.message || 'An error occurred during payout');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreatePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmittingNew(true);

    try {
      const res = await apiClient.createPayroll({
        employeeId: selectedEmployeeId,
        payPeriodStart,
        payPeriodEnd,
        basicSalary: Number(basicSalary),
        overtimeAmount: Number(overtimeAmount),
        deductions: Number(deductions),
        status: 'DRAFT',
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        await loadData();
      } else {
        setErrorMsg(res.message || 'Failed to create payroll record');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Metrics
  const totalNetPayroll = useMemo(() => payroll.reduce((acc, p) => acc + p.netSalary, 0), [payroll]);
  const totalBaseSalaries = useMemo(() => payroll.reduce((acc, p) => acc + p.baseSalary, 0), [payroll]);
  const paidCount = useMemo(() => payroll.filter((p) => p.status === 'PAID').length, [payroll]);
  const pendingCount = useMemo(() => payroll.filter((p) => p.status !== 'PAID').length, [payroll]);
  const totalDeductions = useMemo(() => payroll.reduce((acc, p) => acc + p.deductions, 0), [payroll]);

  const filteredPayroll = useMemo(() => {
    if (statusFilter === 'ALL') return payroll;
    if (statusFilter === 'PAID') return payroll.filter((p) => p.status === 'PAID');
    return payroll.filter((p) => p.status !== 'PAID');
  }, [payroll, statusFilter]);

  const columns: Column<PayrollRecord>[] = [
    {
      header: 'Employee ID & Name',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-textPrimary">{row.employeeName}</p>
          <p className="text-xs text-textMuted">
            {row.employeeId} • {row.designation}
          </p>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
          {row.department}
        </span>
      ),
    },
    {
      header: 'Pay Period',
      accessor: (row) => <span className="text-xs text-textSecondary">{row.payPeriod}</span>,
    },
    {
      header: 'Base Salary',
      accessor: (row) => <span className="text-xs font-medium text-textSecondary">{formatCurrency(row.baseSalary)}</span>,
    },
    {
      header: 'Overtime',
      accessor: (row) => (
        <span className="text-xs text-textSecondary">
          {row.overtimePay > 0 ? `+${formatCurrency(row.overtimePay)}` : '-'}
        </span>
      ),
    },
    {
      header: 'Deductions (PF/Tax)',
      accessor: (row) => (
        <span className="text-xs font-medium text-danger">
          {row.deductions > 0 ? `-${formatCurrency(row.deductions)}` : '-'}
        </span>
      ),
    },
    {
      header: 'Net Payable',
      accessor: (row) => <span className="font-bold text-textPrimary">{formatCurrency(row.netSalary)}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.status === 'PAID' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Action',
      accessor: (row) => (
        <Button
          size="sm"
          variant={row.status === 'PAID' ? 'secondary' : 'primary'}
          disabled={row.status === 'PAID'}
          onClick={() => setSelectedRecord(row)}
          icon={DollarSign}
        >
          {row.status === 'PAID' ? 'Disbursed' : 'Process Payout'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plant Employee Payroll & Deductions"
        description="Calculate employee net salaries, tax/PF deductions, overtime compensation, and execute bank salary disbursements."
        breadcrumb={['AquaNexus', 'Accountant', 'Payroll']}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={loadData} isLoading={isLoading} icon={RefreshCw}>
              Refresh
            </Button>
            <Button
              onClick={() => {
                setErrorMsg('');
                setIsCreateModalOpen(true);
              }}
              icon={Plus}
            >
              Generate Payroll
            </Button>
          </div>
        }
      />

      {/* Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Total Net Payroll</p>
              <p className="text-xl font-bold text-textPrimary mt-1">{formatCurrency(totalNetPayroll)}</p>
              <p className="text-xs text-textSecondary mt-0.5">Base: {formatCurrency(totalBaseSalaries)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Disbursed Records</p>
              <p className="text-xl font-bold text-emerald-600 mt-1">{paidCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Direct bank settled</p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">Pending Payouts</p>
              <p className="text-xl font-bold text-amber-600 mt-1">{pendingCount}</p>
              <p className="text-xs text-textSecondary mt-0.5">Awaiting disbursement</p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card padding="sm" className="bg-surface">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-textSecondary">PF &amp; Tax Deductions</p>
              <p className="text-xl font-bold text-danger mt-1">-{formatCurrency(totalDeductions)}</p>
              <p className="text-xs text-textSecondary mt-0.5">Statutory withholdings</p>
            </div>
            <div className="p-2.5 rounded-lg bg-red-50 text-red-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'ALL' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('ALL')}
        >
          All Records ({payroll.length})
        </Button>
        <Button
          variant={statusFilter === 'PAID' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('PAID')}
        >
          Disbursed ({paidCount})
        </Button>
        <Button
          variant={statusFilter === 'PENDING' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setStatusFilter('PENDING')}
        >
          Pending Payout ({pendingCount})
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredPayroll}
        isLoading={isLoading}
        searchPlaceholder="Search payroll by employee name or code..."
        emptyMessage="No payroll records found."
      />

      {/* Salary Process Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Process Bank Payout: ${selectedRecord.employeeName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-bgMain rounded-xl border border-border space-y-2">
              <div className="flex justify-between text-textSecondary">
                <span>Employee &amp; Designation</span>
                <span className="font-semibold text-textPrimary">
                  {selectedRecord.employeeName} ({selectedRecord.designation})
                </span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>Pay Period</span>
                <span className="font-semibold text-textPrimary">{selectedRecord.payPeriod}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>Base Salary</span>
                <span className="font-semibold text-textPrimary">{formatCurrency(selectedRecord.baseSalary)}</span>
              </div>
              {selectedRecord.overtimePay > 0 && (
                <div className="flex justify-between text-textSecondary">
                  <span>Overtime Compensation</span>
                  <span className="font-semibold text-textPrimary">+{formatCurrency(selectedRecord.overtimePay)}</span>
                </div>
              )}
              {selectedRecord.deductions > 0 && (
                <div className="flex justify-between text-textSecondary">
                  <span>PF &amp; Tax Deductions</span>
                  <span className="font-semibold text-danger">-{formatCurrency(selectedRecord.deductions)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-border text-sm font-bold">
                <span>Net Payable Salary</span>
                <span className="text-primary text-base">{formatCurrency(selectedRecord.netSalary)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedRecord(null)}>
                Cancel
              </Button>
              <Button isLoading={isProcessing} onClick={handleProcessSalary} icon={CheckCircle2}>
                Confirm Live Bank Payout
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Generate Payroll Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate Monthly Employee Payroll Record"
      >
        <form onSubmit={handleCreatePayroll} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">{errorMsg}</div>
          )}

          <Select
            label="Select Plant Employee"
            options={employees.map((e) => ({
              label: `${e.firstName} ${e.lastName} (${e.employeeCode} - ${e.designation})`,
              value: e.id,
            }))}
            value={selectedEmployeeId}
            onChange={(e) => {
              setSelectedEmployeeId(e.target.value);
              const emp = employees.find((em) => em.id === e.target.value);
              if (emp?.salary) setBasicSalary(Number(emp.salary));
            }}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Pay Period Start"
              type="date"
              value={payPeriodStart}
              onChange={(e) => setPayPeriodStart(e.target.value)}
              required
            />
            <Input
              label="Pay Period End"
              type="date"
              value={payPeriodEnd}
              onChange={(e) => setPayPeriodEnd(e.target.value)}
              required
            />
          </div>

          <Input
            label="Basic Monthly Salary (₹)"
            type="number"
            min="0"
            value={basicSalary}
            onChange={(e) => setBasicSalary(parseFloat(e.target.value) || 0)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Overtime Amount (₹)"
              type="number"
              min="0"
              value={overtimeAmount}
              onChange={(e) => setOvertimeAmount(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Deductions (PF/Tax) (₹)"
              type="number"
              min="0"
              value={deductions}
              onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="p-3 bg-bgMain rounded-lg border border-border flex justify-between items-center text-sm font-bold">
            <span>Calculated Net Salary:</span>
            <span className="text-primary text-base">
              {formatCurrency(Math.max(0, basicSalary + overtimeAmount - deductions))}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border/60">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingNew} icon={Plus}>
              Create Payroll Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AccountantPayroll;
