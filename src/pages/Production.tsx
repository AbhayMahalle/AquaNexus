import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, Column } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { showToast, exportToCSV } from '@/lib/api';
import { Factory, Plus, Search, Download, Eye, X, Zap, TrendingUp } from 'lucide-react';

interface ProductionRow {
  id: string;
  line: string;
  item: string;
  target: number;
  produced: number;
  efficiency: string;
  status: 'running' | 'idle' | 'maintenance';
  operator: string;
  batchNo: string;
  shift: string;
}

const MOCK_PROD: ProductionRow[] = [
  { id: '1', line: 'Filling Line 1 (20L Jars)', item: '20L Reusable Jar', target: 3000, produced: 2850, efficiency: '95%', status: 'running', operator: 'Ramesh K.', batchNo: 'BATCH-2026-089', shift: 'Morning' },
  { id: '2', line: 'Bottling Line 2 (1L Packaged)', item: '1L PET Bottle', target: 10000, produced: 8200, efficiency: '82%', status: 'running', operator: 'Sunil P.', batchNo: 'BATCH-2026-090', shift: 'Morning' },
  { id: '3', line: 'Pouch Line 3 (500ml)', item: '500ml Water Pouch', target: 5000, produced: 0, efficiency: '0%', status: 'maintenance', operator: 'Amit S.', batchNo: 'BATCH-2026-091', shift: 'Morning' },
  { id: '4', line: 'UV Treatment Line 4', item: 'Purified Water Feed', target: 50000, produced: 42000, efficiency: '84%', status: 'running', operator: 'Prashant G.', batchNo: 'BATCH-2026-092', shift: 'Morning' },
  { id: '5', line: 'RO Filter Line 5', item: 'Raw Water Processing', target: 60000, produced: 0, efficiency: '0%', status: 'idle', operator: '-', batchNo: '-', shift: 'Evening' },
];

const ITEMS_PER_PAGE = 5;

export default function ProductionPage() {
  const [production, setProduction] = useState<ProductionRow[]>(MOCK_PROD);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ProductionRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newBatch, setNewBatch] = useState({ line: '', item: '', target: '', operator: '', shift: 'Morning' });

  const filtered = useMemo(() => {
    let data = production;
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(r => r.line.toLowerCase().includes(q) || r.item.toLowerCase().includes(q) || r.operator.toLowerCase().includes(q));
    }
    if (statusFilter) data = data.filter(r => r.status === statusFilter);
    return data;
  }, [production, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Stats
  const stats = useMemo(() => ({
    totalTarget: production.reduce((a, r) => a + r.target, 0),
    totalProduced: production.reduce((a, r) => a + r.produced, 0),
    running: production.filter(r => r.status === 'running').length,
    idle: production.filter(r => r.status === 'idle').length,
    maintenance: production.filter(r => r.status === 'maintenance').length,
  }), [production]);

  const overallEfficiency = stats.totalTarget > 0 ? Math.round((stats.totalProduced / stats.totalTarget) * 100) : 0;

  const handleAdd = async () => {
    if (!newBatch.line.trim() || !newBatch.item.trim()) { showToast('Fill required fields', 'warning'); return; }
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 400));
    const entry: ProductionRow = {
      id: `prod_${Date.now()}`,
      line: newBatch.line,
      item: newBatch.item,
      target: parseInt(newBatch.target) || 0,
      produced: 0,
      efficiency: '0%',
      status: 'idle',
      operator: newBatch.operator || '-',
      batchNo: `BATCH-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`,
      shift: newBatch.shift,
    };
    setProduction(prev => [entry, ...prev]);
    setIsAddOpen(false);
    setNewBatch({ line: '', item: '', target: '', operator: '', shift: 'Morning' });
    setIsSaving(false);
    showToast(`Production line "${entry.line}" added`, 'success');
  };

  const handleExport = () => {
    exportToCSV(filtered, [
      { key: 'batchNo', header: 'Batch No' },
      { key: 'line', header: 'Production Line' },
      { key: 'item', header: 'Product' },
      { key: 'target', header: 'Target' },
      { key: 'produced', header: 'Produced' },
      { key: 'efficiency', header: 'Efficiency' },
      { key: 'status', header: 'Status' },
      { key: 'operator', header: 'Operator' },
    ], 'production_report');
  };

  const columns: Column<ProductionRow>[] = [
    { key: 'batchNo', header: 'Batch', render: (r) => <span className="font-mono text-xs font-bold text-[#0F4C81]">{r.batchNo}</span> },
    { key: 'line', header: 'Production Line', render: (r) => <span className="font-bold text-[#172033]">{r.line}</span> },
    { key: 'item', header: 'Output Product' },
    { key: 'target', header: 'Target', render: (r) => r.target.toLocaleString() },
    { key: 'produced', header: 'Actual', render: (r) => r.produced.toLocaleString() },
    { key: 'efficiency', header: 'Efficiency', render: (r) => (
      <span className={`font-semibold ${parseInt(r.efficiency) >= 80 ? 'text-[#16A34A]' : parseInt(r.efficiency) >= 50 ? 'text-[#F59E0B]' : 'text-[#DC2626]'}`}>{r.efficiency}</span>
    ) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const map: Record<string, 'success' | 'warning' | 'danger'> = { running: 'success', idle: 'warning', maintenance: 'danger' };
        return <Badge variant={map[r.status]}>{r.status.toUpperCase()}</Badge>;
      }
    },
    {
      key: 'actions', header: 'Actions', align: 'right',
      render: (r) => (
        <button onClick={() => { setSelectedRow(r); setIsViewOpen(true); }} className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F4C81] hover:bg-[#F5F8FB] transition-colors" title="View Details">
          <Eye className="w-4 h-4" />
        </button>
      )
    },
  ];

  return (
    <AuthGuard allowedRoles={['manager', 'admin', 'operator']}>
      <DashboardLayout>
        <PageHeader
          title="Production Line Operations"
          description="Batch monitoring, filling speed, and raw water purification output"
          breadcrumbs={[{ label: 'Operations' }, { label: 'Production' }]}
          primaryAction={{ label: 'New Batch', icon: <Plus className="w-4 h-4" />, onClick: () => setIsAddOpen(true) }}
          secondaryActions={[{ label: 'Export', icon: <Download className="w-4 h-4" />, variant: 'outline', onClick: handleExport }]}
        />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0F4C81]/10"><Zap className="w-5 h-5 text-[#0F4C81]" /></div>
            <div><p className="text-xs text-[#64748B] font-semibold">Lines Running</p><p className="text-lg font-bold text-[#172033]">{stats.running}/{production.length}</p></div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#16A34A]/10"><TrendingUp className="w-5 h-5 text-[#16A34A]" /></div>
            <div><p className="text-xs text-[#64748B] font-semibold">Overall Efficiency</p><p className="text-lg font-bold text-[#172033]">{overallEfficiency}%</p></div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <p className="text-xs text-[#64748B] font-semibold">Total Target</p>
            <p className="text-lg font-bold text-[#172033]">{stats.totalTarget.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2E8F0] shadow-xs">
            <p className="text-xs text-[#64748B] font-semibold">Total Produced</p>
            <p className="text-lg font-bold text-[#16A34A]">{stats.totalProduced.toLocaleString()}</p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
            <CardTitle className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-[#0F4C81]" />
              <span>Plant Filling Lines Status</span>
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} leftIcon={<Search className="w-4 h-4 text-[#94A3B8]" />} className="sm:!w-48" />
              <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                options={[{ label: 'All Status', value: '' }, { label: 'Running', value: 'running' }, { label: 'Idle', value: 'idle' }, { label: 'Maintenance', value: 'maintenance' }]}
                className="!w-36"
              />
              {(search || statusFilter) && (
                <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter(''); setCurrentPage(1); }} leftIcon={<X className="w-3.5 h-3.5" />}>Clear</Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table columns={columns} data={paginated} emptyText="No production lines found" />
            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setCurrentPage} />
          </CardContent>
        </Card>

        {/* Add Batch Modal */}
        <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Production Line / Batch" description="Register a new filling line batch"
          footer={<><Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button><Button variant="primary" onClick={handleAdd} loading={isSaving}>Create Batch</Button></>}
        >
          <div className="space-y-4">
            <Input label="Production Line" required placeholder="e.g. Filling Line 6 (20L)" value={newBatch.line} onChange={(e) => setNewBatch(p => ({ ...p, line: e.target.value }))} />
            <Input label="Output Product" required placeholder="e.g. 20L Water Jar" value={newBatch.item} onChange={(e) => setNewBatch(p => ({ ...p, item: e.target.value }))} />
            <Input label="Shift Target" type="number" placeholder="e.g. 5000" value={newBatch.target} onChange={(e) => setNewBatch(p => ({ ...p, target: e.target.value }))} />
            <Input label="Operator" placeholder="e.g. Ramesh K." value={newBatch.operator} onChange={(e) => setNewBatch(p => ({ ...p, operator: e.target.value }))} />
            <Select label="Shift" value={newBatch.shift} onChange={(e) => setNewBatch(p => ({ ...p, shift: e.target.value }))}
              options={[{ label: 'Morning', value: 'Morning' }, { label: 'Evening', value: 'Evening' }, { label: 'Night', value: 'Night' }]}
            />
          </div>
        </Modal>

        {/* View Details Modal */}
        <Modal isOpen={isViewOpen} onClose={() => { setIsViewOpen(false); setSelectedRow(null); }} title={`Line Details: ${selectedRow?.line || ''}`}>
          {selectedRow && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-xs text-[#64748B] font-semibold">Batch No</p><p className="font-mono text-[#0F4C81] font-bold">{selectedRow.batchNo}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Status</p><Badge variant={selectedRow.status === 'running' ? 'success' : selectedRow.status === 'idle' ? 'warning' : 'danger'}>{selectedRow.status.toUpperCase()}</Badge></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Product</p><p className="text-[#172033]">{selectedRow.item}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Operator</p><p className="text-[#172033]">{selectedRow.operator}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Target</p><p className="text-[#172033]">{selectedRow.target.toLocaleString()}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Produced</p><p className="text-[#172033] font-bold">{selectedRow.produced.toLocaleString()}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Efficiency</p><p className="font-bold text-[#16A34A]">{selectedRow.efficiency}</p></div>
                <div><p className="text-xs text-[#64748B] font-semibold">Shift</p><p className="text-[#172033]">{selectedRow.shift}</p></div>
              </div>
              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1"><span className="text-[#64748B]">Output Progress</span><span className="font-bold text-[#172033]">{selectedRow.efficiency}</span></div>
                <div className="h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0F4C81] to-[#1597D4] rounded-full transition-all" style={{ width: selectedRow.efficiency }} />
                </div>
              </div>
            </div>
          )}
        </Modal>
      </DashboardLayout>
    </AuthGuard>
  );
}
