import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Factory, Clock, PackageCheck, Eye } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { productionService } from '../../services/productionService';
import type { Production, ProductionStatus } from '../../types';

export const ProductionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Production[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchBatches = async () => {
    setIsLoading(true);
    const res = await productionService.getProductionBatches({ status, search });
    if (res.success) setBatches(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBatches();
  }, [status, search]);

  const totalQuantity = batches.reduce((sum, b) => sum + (b.status === 'COMPLETED' ? b.quantityProduced : 0), 0);
  const completedCount = batches.filter((b) => b.status === 'COMPLETED').length;
  const inProgressCount = batches.filter((b) => b.status === 'IN_PROGRESS').length;

  const columns = [
    {
      header: 'Batch Number',
      accessorKey: 'batchNumber' as keyof Production,
      cell: (b: Production) => <span className="font-semibold text-primary">{b.batchNumber}</span>,
    },
    {
      header: 'Product Name',
      cell: (b: Production) => (
        <div>
          <p className="font-semibold text-text-primary">{b.productName}</p>
          <p className="text-[11px] text-text-secondary">Code: {b.productId}</p>
        </div>
      ),
    },
    {
      header: 'Output Quantity',
      cell: (b: Production) => (
        <span className="font-bold text-text-primary">
          {b.quantityProduced.toLocaleString()} {b.unit}
        </span>
      ),
    },
    {
      header: 'Production Date / Shift',
      cell: (b: Production) => (
        <div>
          <p className="text-xs font-semibold text-text-primary">{b.productionDate}</p>
          <p className="text-[11px] text-text-secondary">{b.shift} Shift</p>
        </div>
      ),
    },
    {
      header: 'Supervisor',
      accessorKey: 'supervisor' as keyof Production,
    },
    {
      header: 'Batch Status',
      cell: (b: Production) => {
        const variantMap: Record<ProductionStatus, 'success' | 'warning' | 'info' | 'danger'> = {
          COMPLETED: 'success',
          IN_PROGRESS: 'warning',
          PENDING: 'info',
          CANCELLED: 'danger',
        };
        return <Badge variant={variantMap[b.status]}>{b.status.replace('_', ' ')}</Badge>;
      },
    },
    {
      header: 'Store Received',
      cell: (b: Production) => (
        <Badge variant={b.goodsReceivedStatus === 'RECEIVED' ? 'success' : 'neutral'}>
          {b.goodsReceivedStatus}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (b: Production) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/production/${b.id}`)}
          title="View Batch Details"
          icon={<Eye className="w-3.5 h-3.5 text-secondary" />}
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Production Batches"
        description="Monitor plant water purification, bottling operations and output logs."
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/production/create')}
          >
            Create Production Batch
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Total Daily Output</p>
            <h4 className="text-2xl font-bold text-text-primary">{totalQuantity.toLocaleString()} Units</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg text-status-success">
            <PackageCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">Completed Batches</p>
            <h4 className="text-2xl font-bold text-text-primary">{completedCount}</h4>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg text-status-warning">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-text-secondary">In-Progress Lines</p>
            <h4 className="text-2xl font-bold text-text-primary">{inProgressCount}</h4>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-72">
            <Input
              placeholder="Search batch #, product, supervisor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="w-44">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Status' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'PENDING', label: 'Pending' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        data={batches}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyText="No production batches found."
      />
    </div>
  );
};
