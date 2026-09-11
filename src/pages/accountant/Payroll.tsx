import React, { useEffect, useState } from 'react';
import { Users, CheckCircle2, DollarSign } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table, Column } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { apiClient } from '@/lib/api-client';
import { PayrollRecord } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

export const AccountantPayroll: React.FC = () => {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadPayroll() {
      const res = await apiClient.getPayroll();
      if (res.success) setPayroll(res.data);
    }
    loadPayroll();
  }, []);

  const handleProcessSalary = async () => {
    if (!selectedRecord) return;
    setIsProcessing(true);

    // Simulate backend payment recording
    await apiClient.recordPayment({
      referenceId: `SAL-TXN-${Date.now()}`,
      payerName: `Salary Payment - ${selectedRecord.employeeName}`,
      paymentType: 'SALARY_PAYMENT',
      paymentMethod: 'BANK_TRANSFER',
      amount: selectedRecord.netSalary,
      notes: `Monthly Salary payout for period ${selectedRecord.payPeriod}`,
    });

    setPayroll(prev =>
      prev.map(p =>
        p.id === selectedRecord.id
          ? { ...p, status: 'PAID', paidDate: new Date().toISOString().split('T')[0] }
          : p
      )
    );

    setIsProcessing(false);
    setSelectedRecord(null);
  };

  const columns: Column<PayrollRecord>[] = [
    {
      header: 'Employee ID & Name',
      accessor: (row) => (
        <div>
          <p className="font-semibold text-textPrimary">{row.employeeName}</p>
          <p className="text-xs text-textMuted">{row.employeeId} • {row.designation}</p>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: (row) => <span className="text-xs font-medium text-textSecondary">{row.department}</span>,
    },
    {
      header: 'Pay Period',
      accessor: (row) => <span className="text-xs text-textSecondary">{row.payPeriod}</span>,
    },
    {
      header: 'Base Salary',
      accessor: (row) => <span className="text-xs text-textSecondary">{formatCurrency(row.baseSalary)}</span>,
    },
    {
      header: 'Overtime Pay',
      accessor: (row) => (
        <span className="text-xs text-textSecondary">
          {row.overtimeHours > 0 ? `${formatCurrency(row.overtimePay)} (${row.overtimeHours} hrs)` : '-'}
        </span>
      ),
    },
    {
      header: 'Deductions',
      accessor: (row) => <span className="text-xs text-danger">-{formatCurrency(row.deductions)}</span>,
    },
    {
      header: 'Net Salary',
      accessor: (row) => <span className="font-bold text-textPrimary">{formatCurrency(row.netSalary)}</span>,
    },
    {
      header: 'Status',
      accessor: (row) => <Badge variant={row.status === 'PAID' ? 'success' : 'warning'}>{row.status}</Badge>,
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
        title="Plant Employee Payroll"
        description="Calculate employee net salaries based on attendance, overtime hours, and deduction inputs."
        breadcrumb={['AquaNexus', 'Accountant', 'Payroll']}
      />

      <Table columns={columns} data={payroll} searchPlaceholder="Search payroll by employee name..." />

      {/* Salary Process Modal */}
      {selectedRecord && (
        <Modal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          title={`Process Salary for ${selectedRecord.employeeName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-bgMain rounded-xl border border-border space-y-2">
              <div className="flex justify-between text-textSecondary">
                <span>Base Salary</span>
                <span className="font-semibold text-textPrimary">{formatCurrency(selectedRecord.baseSalary)}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>Overtime Pay ({selectedRecord.overtimeHours} hrs)</span>
                <span className="font-semibold text-textPrimary">+{formatCurrency(selectedRecord.overtimePay)}</span>
              </div>
              <div className="flex justify-between text-textSecondary">
                <span>PF & Tax Deductions</span>
                <span className="font-semibold text-danger">-{formatCurrency(selectedRecord.deductions)}</span>
              </div>
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
                Confirm Bank Payout
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
