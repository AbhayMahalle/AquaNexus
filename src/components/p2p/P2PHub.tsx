import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { P2PStatusBadge, PriorityBadge, ThreeWayMatchBadge } from './P2PStatusBadge';
import { P2PStepper } from './P2PStepper';
import {
  CreatePRModal,
  FinalizeRatesModal,
  GeneratePOModal,
  VendorPOModal,
  GoodsReceivedModal,
  SubmitInvoiceModal,
  ReviewInvoiceModal,
  CycleTrackerModal,
} from './P2PModals';
import {
  PurchaseRequisition,
  PurchaseOrder,
  P2PDashboardSummary,
  P2PCycleTracker,
} from '@/types/p2p';
import {
  Layers,
  FilePlus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Truck,
  PackageCheck,
  CreditCard,
  FileText,
  AlertTriangle,
  ArrowRight,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Building,
  Shield,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface P2PHubProps {
  initialPerspective?: 'admin' | 'store_manager' | 'manager' | 'supplier' | 'accountant';
  pageTitle?: string;
  pageSubtitle?: string;
  defaultTab?: 'REQUISITIONS' | 'ORDERS' | 'CHALLANS' | 'GRN' | 'INVOICES';
}

export function P2PHub({
  initialPerspective,
  pageTitle = 'Procurement-to-Pay (P2P) Cycle',
  pageSubtitle = 'End-to-End Enterprise Procurement Workflow: Quantity Request → Rate Approval → PO → Challan → GRN → Invoice → Payment',
  defaultTab,
}: P2PHubProps) {
  const { user } = useAuth();
  const rawRole = (user?.role || 'admin') as string;
  const isAdmin = rawRole === 'admin' || rawRole === 'super_admin' || Boolean(user?.isSuperAdmin);

  // Active view perspective:
  // If user is Admin: defaults to initialPerspective or 'admin', and Admin can toggle perspective.
  // If user is NOT Admin: perspective is strictly locked to initialPerspective or their actual role (cannot switch).
  const [perspective, setPerspective] = useState<string>(
    isAdmin ? (initialPerspective || 'admin') : (initialPerspective || rawRole)
  );

  const activePerspective = isAdmin ? perspective : (initialPerspective || rawRole);

  // STRICT SEPARATION OF DUTIES:
  // Admin cannot perform any operations directly, but has full visibility over the timeline and audit trail.
  // Each functional role can execute only their specific stage in the P2P cycle.
  const isOperationalAllowed = !isAdmin;

  // 1. Store Manager Operations
  const canStoreCreatePR = isOperationalAllowed && activePerspective === 'store_manager';
  const canStoreGeneratePO = isOperationalAllowed && (activePerspective === 'store_manager' || activePerspective === 'manager');
  const canStoreReceiveGoods = isOperationalAllowed && activePerspective === 'store_manager';

  // 2. Operational Manager Operations
  const canManagerFinalizeRates = isOperationalAllowed && activePerspective === 'manager';

  // 3. Vendor / Supplier Operations
  const canVendorAcceptOrDispatch = isOperationalAllowed && activePerspective === 'supplier';
  const canVendorSubmitInvoice = isOperationalAllowed && activePerspective === 'supplier';

  // 4. Accountant Operations
  const canAccountantPay = isOperationalAllowed && activePerspective === 'accountant';

  // Determine available tabs for current role's side
  const roleTabKeys = useMemo<('REQUISITIONS' | 'ORDERS' | 'CHALLANS' | 'GRN' | 'INVOICES')[]>(() => {
    if (activePerspective === 'admin') {
      return ['REQUISITIONS', 'ORDERS', 'CHALLANS', 'GRN', 'INVOICES'];
    }
    if (activePerspective === 'store_manager') {
      return ['REQUISITIONS', 'ORDERS', 'CHALLANS', 'GRN'];
    }
    if (activePerspective === 'manager') {
      return ['REQUISITIONS', 'ORDERS'];
    }
    if (activePerspective === 'supplier') {
      return ['ORDERS', 'CHALLANS', 'INVOICES'];
    }
    if (activePerspective === 'accountant') {
      return ['INVOICES', 'ORDERS', 'GRN'];
    }
    return ['REQUISITIONS', 'ORDERS', 'CHALLANS', 'GRN', 'INVOICES'];
  }, [activePerspective]);

  // Initial tab resolution
  const initialActiveTab = useMemo<'REQUISITIONS' | 'ORDERS' | 'CHALLANS' | 'GRN' | 'INVOICES'>(() => {
    if (defaultTab && roleTabKeys.includes(defaultTab)) return defaultTab;
    if (activePerspective === 'accountant') return 'INVOICES';
    if (activePerspective === 'supplier') return 'ORDERS';
    return roleTabKeys[0] || 'REQUISITIONS';
  }, [defaultTab, roleTabKeys, activePerspective]);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<'REQUISITIONS' | 'ORDERS' | 'CHALLANS' | 'GRN' | 'INVOICES'>(initialActiveTab);

  // Sync tab if perspective switches
  useEffect(() => {
    if (!roleTabKeys.includes(activeTab)) {
      setActiveTab(roleTabKeys[0] || 'REQUISITIONS');
    }
  }, [roleTabKeys, activeTab]);

  // Data states
  const [stats, setStats] = useState<P2PDashboardSummary | null>(null);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal control states
  const [isCreatePROpen, setIsCreatePROpen] = useState(false);
  const [finalizeTargetPR, setFinalizeTargetPR] = useState<PurchaseRequisition | null>(null);
  const [generatePOTargetPR, setGeneratePOTargetPR] = useState<PurchaseRequisition | null>(null);
  const [vendorTargetOrder, setVendorTargetOrder] = useState<PurchaseOrder | null>(null);
  const [grnTargetOrder, setGrnTargetOrder] = useState<PurchaseOrder | null>(null);
  const [submitInvoiceTargetOrder, setSubmitInvoiceTargetOrder] = useState<PurchaseOrder | null>(null);
  const [reviewInvoiceTarget, setReviewInvoiceTarget] = useState<any | null>(null);
  const [trackerTargetId, setTrackerTargetId] = useState<string | null>(null);

  // Load P2P data from backend
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, prRes, poRes] = await Promise.all([
        apiClient.getP2PDashboardStats(),
        apiClient.getP2PRequisitions(),
        apiClient.getP2POrders(),
      ]);

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
      if (prRes.success && prRes.data?.requisitions) {
        setRequisitions(prRes.data.requisitions);
      }
      if (poRes.success && poRes.data?.orders) {
        setOrders(poRes.data.orders);
      }
    } catch (err) {
      console.error('Failed to load P2P data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered requisitions
  const filteredRequisitions = requisitions.filter((pr) => {
    const matchesSearch =
      pr.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered orders
  const filteredOrders = orders.filter((po) => {
    const matchesSearch =
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || po.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // All tabs metadata
  const ALL_TABS_CONFIG = [
    {
      key: 'REQUISITIONS' as const,
      label: '1. Requisitions (PR)',
      count: requisitions.length,
      badge: `${requisitions.filter((x) => x.status === 'PENDING_RATE_APPROVAL').length} Action Needed`,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      key: 'ORDERS' as const,
      label: '2. Purchase Orders (PO)',
      count: orders.length,
      badge: `${orders.filter((x) => x.status === 'OUT_FOR_DELIVERY' || x.status === 'ISSUED').length} Active`,
      badgeColor: 'bg-orange-100 text-orange-800',
    },
    {
      key: 'CHALLANS' as const,
      label: '3. Delivery Challans & Dispatch',
      count: orders.filter((o) => o.challans && o.challans.length > 0).length,
    },
    {
      key: 'GRN' as const,
      label: '4. Goods Received Notes (GRN)',
      count: orders.filter((o) => o.goodsReceivedNotes && o.goodsReceivedNotes.length > 0).length,
    },
    {
      key: 'INVOICES' as const,
      label: '5. Invoices, 3-Way Match & Pay',
      count: orders.filter((o) => o.vendorInvoices && o.vendorInvoices.length > 0).length,
      badge: `${orders.filter((o) => o.vendorInvoices?.some((i) => i.status === 'SUBMITTED' || i.status === 'APPROVED')).length} Pending`,
      badgeColor: 'bg-teal-100 text-teal-800',
    },
  ];

  const visibleTabs = ALL_TABS_CONFIG.filter((t) => roleTabKeys.includes(t.key));

  return (
    <div className="space-y-6 text-black">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>{pageTitle}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                  P2P Lifecycle
                </span>
              </h1>
              <p className="text-xs text-gray-600 mt-0.5">{pageSubtitle}</p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 text-xs font-bold">
              <Shield className="w-3.5 h-3.5 text-orange-600" />
              <span>Admin View-Only (Audit Mode)</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            loading={isLoading}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          {canStoreCreatePR && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FilePlus className="w-4 h-4" />}
              onClick={() => setIsCreatePROpen(true)}
            >
              Quantity Request (PR)
            </Button>
          )}
        </div>
      </div>

      {/* Role Perspective Selector Bar — ONLY shown to Admin */}
      {isAdmin ? (
        <div className="bg-gradient-to-r from-orange-50/50 via-white to-orange-50/50 border border-orange-200 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-800 flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-orange-600" />
                Active Role Perspective:
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'admin', label: '👑 Admin (Command Center Overview)', color: 'bg-orange-100 text-orange-900 border-orange-300' },
                  { key: 'store_manager', label: '📦 Store Manager View', color: 'bg-amber-100 text-amber-900 border-amber-300' },
                  { key: 'manager', label: '⚙️ Operational Manager View', color: 'bg-blue-100 text-blue-900 border-blue-300' },
                  { key: 'supplier', label: '🚚 Vendor / Supplier View', color: 'bg-purple-100 text-purple-900 border-purple-300' },
                  { key: 'accountant', label: '💰 Accountant View', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
                ].map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setPerspective(r.key)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      perspective === r.key
                        ? `${r.color} shadow-xs ring-2 ring-orange-500/20`
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-gray-500 font-medium">
              Multi-Role Audit Inspector
            </div>
          </div>

          <div className="flex items-center gap-2 bg-orange-100/60 border border-orange-200 rounded-xl px-3 py-1.5 text-xs text-orange-950 font-medium">
            <Info className="w-4 h-4 text-orange-600 shrink-0" />
            <span>
              <strong>Admin Governance Policy:</strong> You have full visibility into timelines, documents, and audit trails. To maintain statutory separation of duties, administrative accounts cannot execute transactions directly. Operational actions must be executed through individual role dashboards.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <span className="text-xs font-extrabold text-gray-900">
                {activePerspective === 'store_manager' && '📦 Store Manager Procurement Dashboard'}
                {activePerspective === 'manager' && '⚙️ Operational Manager Rate Finalisation Desk'}
                {activePerspective === 'supplier' && '🚚 Vendor Fulfillment & Consignment Portal'}
                {activePerspective === 'accountant' && '💰 Finance & Accounts Settlement Portal'}
              </span>
              <p className="text-[11px] text-gray-500">
                Dedicated role portal — you can view and update only your side of the P2P cycle. Complete timeline and audit trail is available on every record.
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Role-Authorized</span>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      {stats?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-white border-gray-200 shadow-2xs rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              1. Total Requisitions
            </span>
            <div className="text-xl font-black text-gray-900 mt-1">
              {stats.summary.totalRequisitions}
            </div>
            <span className="text-[10px] text-amber-600 font-semibold">
              {stats.summary.pendingRateApproval} pending rate approval
            </span>
          </Card>

          <Card className="bg-white border-gray-200 shadow-2xs rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              2. Rates Finalized
            </span>
            <div className="text-xl font-black text-blue-700 mt-1">
              {stats.summary.ratesFinalized}
            </div>
            <span className="text-[10px] text-gray-500">Approved by Ops Manager</span>
          </Card>

          <Card className="bg-white border-gray-200 shadow-2xs rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              3. Out For Delivery
            </span>
            <div className="text-xl font-black text-orange-600 mt-1">
              {stats.summary.outForDelivery}
            </div>
            <span className="text-[10px] text-orange-600 font-semibold animate-pulse">
              En route to Store dock
            </span>
          </Card>

          <Card className="bg-white border-gray-200 shadow-2xs rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              4. Goods Received
            </span>
            <div className="text-xl font-black text-emerald-700 mt-1">
              {stats.summary.goodsReceived}
            </div>
            <span className="text-[10px] text-emerald-600 font-semibold">Store inventory inwarded</span>
          </Card>

          <Card className="bg-white border-gray-200 shadow-2xs rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              5. Completed Payments
            </span>
            <div className="text-xl font-black text-emerald-800 mt-1">
              {stats.summary.completedPayments}
            </div>
            <span className="text-[10px] text-gray-500">{stats.summary.pendingInvoices} invoices awaiting</span>
          </Card>

          <Card className="bg-white border-gray-200 shadow-2xs rounded-xl p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
              Total Spend (P2P)
            </span>
            <div className="text-xl font-black text-gray-900 mt-1">
              ₹{Number(stats.summary.totalSpend).toLocaleString()}
            </div>
            <span className="text-[10px] text-gray-500">Across {stats.summary.suppliersCount} suppliers</span>
          </Card>
        </div>
      )}

      {/* Main Tabs Navigation — Tailored strictly to each role's side */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setStatusFilter('ALL');
              }}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
                activeTab === tab.key
                  ? 'border-orange-500 text-orange-600 bg-white font-extrabold shadow-2xs'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700">
                {tab.count}
              </span>
              {tab.badge && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${tab.badgeColor}`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/60 p-3 rounded-xl border border-gray-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:outline-hidden focus:border-orange-500 font-medium"
            placeholder="Search code, title, material, or supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Filter Status:
          </span>
          <select
            className="text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:outline-hidden"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            {activeTab === 'REQUISITIONS' && (
              <>
                <option value="PENDING_RATE_APPROVAL">Pending Rate Approval</option>
                <option value="RATES_FINALIZED">Rates Finalized</option>
                <option value="PO_ISSUED">PO Issued</option>
                <option value="REJECTED">Rejected</option>
                <option value="COMPLETED">Completed</option>
              </>
            )}
            {activeTab === 'ORDERS' && (
              <>
                <option value="ISSUED">PO Issued</option>
                <option value="VENDOR_ACCEPTED">Vendor Accepted</option>
                <option value="VENDOR_REJECTED">Vendor Rejected</option>
                <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                <option value="GOODS_RECEIVED">Goods Received</option>
                <option value="INVOICE_SUBMITTED">Invoice Submitted</option>
                <option value="COMPLETED">Completed & Paid</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* ========================================================
          TAB 1: PURCHASE REQUISITIONS (PR)
          ======================================================== */}
      {activeTab === 'REQUISITIONS' && (
        <div className="space-y-3">
          {filteredRequisitions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-900">No Purchase Requisitions Found</h3>
              <p className="text-xs text-gray-500 mt-1">
                Store Managers can initiate requests for raw materials and store stock replenishment.
              </p>
              {canStoreCreatePR && (
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setIsCreatePROpen(true)}
                >
                  Create First Requisition
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredRequisitions.map((pr) => {
                const canFinalizeRates =
                  canManagerFinalizeRates &&
                  pr.status === 'PENDING_RATE_APPROVAL';
                const canGeneratePO =
                  canStoreGeneratePO &&
                  pr.status === 'RATES_FINALIZED';

                return (
                  <div
                    key={pr.id}
                    className="bg-white border border-gray-200 hover:border-orange-300 rounded-2xl p-4 shadow-2xs transition-all duration-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold bg-gray-100 text-gray-900 px-2.5 py-1 rounded-lg border border-gray-200">
                          {pr.prNumber}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">{pr.title}</h4>
                          <span className="text-[11px] text-gray-500">
                            Requested by {pr.requester ? `${pr.requester.firstName} ${pr.requester.lastName || ''}` : 'Store Manager'} on{' '}
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={pr.priority} />
                        <P2PStatusBadge status={pr.status} />
                      </div>
                    </div>

                    {/* Items requested snapshot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-500 block uppercase">Items Count:</span>
                        <span className="font-bold text-gray-900">{pr.items?.length || 0} Materials</span>
                        <div className="text-[10px] text-gray-600 truncate mt-0.5">
                          {pr.items?.map((it) => `${it.itemName} (${it.requestedQuantity} ${it.unit})`).join(', ')}
                        </div>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-500 block uppercase">Est. vs Finalized Rate:</span>
                        <div className="font-bold text-gray-900">
                          {pr.finalizedTotal ? (
                            <span className="text-blue-700">₹{Number(pr.finalizedTotal).toLocaleString()}</span>
                          ) : (
                            <span>₹{Number(pr.estimatedTotal).toLocaleString()} (Est.)</span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {pr.rateFinalizer ? `Finalized by ${pr.rateFinalizer.firstName}` : 'Awaiting Ops Approval'}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-500 block uppercase">Assigned Vendor:</span>
                        <span className="font-bold text-gray-900">
                          {pr.supplier?.name || 'Not Yet Assigned'}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          Required by {pr.requiredByDate ? new Date(pr.requiredByDate).toLocaleDateString() : 'ASAP'}
                        </span>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-500 block uppercase">Linked PO:</span>
                        <span className="font-bold font-mono text-indigo-700">
                          {pr.purchaseOrders?.[0]?.poNumber || 'None'}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {pr.purchaseOrders?.[0]?.status ? `Status: ${pr.purchaseOrders[0].status}` : 'Pending generation'}
                        </span>
                      </div>
                    </div>

                    {pr.rejectionReason && (
                      <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>
                          <strong>Rejection Reason:</strong> {pr.rejectionReason}
                        </span>
                      </div>
                    )}

                    {/* Actions Bar — Timeline visible to all, operations strictly role-gated */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setTrackerTargetId(pr.id)}
                        className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Full P2P Timeline & Audit Trail
                      </button>

                      <div className="flex items-center gap-2">
                        {canFinalizeRates && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => setFinalizeTargetPR(pr)}
                          >
                            Finalize Rates & Approve / Reject
                          </Button>
                        )}

                        {canGeneratePO && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => setGeneratePOTargetPR(pr)}
                          >
                            Generate Purchase Order (PO)
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 2: PURCHASE ORDERS (PO)
          ======================================================== */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <Layers className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-gray-900">No Purchase Orders Found</h3>
              <p className="text-xs text-gray-500 mt-1">
                Purchase orders are issued once rates are finalized by the Operational Manager.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredOrders.map((po) => {
                const canVendorAct =
                  canVendorAcceptOrDispatch &&
                  (po.status === 'ISSUED' || po.status === 'VENDOR_ACCEPTED' || po.status === 'CHALLAN_CREATED');

                const canReceiveGoods =
                  canStoreReceiveGoods &&
                  (po.status === 'OUT_FOR_DELIVERY' || po.status === 'CHALLAN_CREATED');

                const canSubmitInvoice =
                  canVendorSubmitInvoice &&
                  po.status === 'GOODS_RECEIVED';

                const canPayInvoice =
                  canAccountantPay &&
                  po.vendorInvoices &&
                  po.vendorInvoices.length > 0 &&
                  (po.vendorInvoices[0].status === 'SUBMITTED' || po.vendorInvoices[0].status === 'APPROVED');

                return (
                  <div
                    key={po.id}
                    className="bg-white border border-gray-200 hover:border-orange-300 rounded-2xl p-4 shadow-2xs transition-all duration-200 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded-lg border border-indigo-200">
                          {po.poNumber}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span>Supplier: {po.supplier?.name}</span>
                            <span className="text-[10px] text-gray-400 font-mono">({po.supplier?.supplierCode})</span>
                          </h4>
                          <span className="text-[11px] text-gray-500">
                            Issued on {new Date(po.issuedAt).toLocaleDateString()} • Terms: {po.paymentTerms || 'Net 30'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900">
                          ₹{Number(po.totalAmount).toLocaleString()}
                        </span>
                        <P2PStatusBadge status={po.status} />
                      </div>
                    </div>

                    {/* Step Cards Snapshot */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-500 uppercase block">1. Challan & Dispatch:</span>
                        <span className="font-bold text-purple-800">
                          {po.challans?.[0]?.challanNumber || 'Awaiting Vendor Challan'}
                        </span>
                        <span className="text-[10px] text-gray-500 block truncate">
                          {po.challans?.[0]?.vehicleNumber ? `Vehicle: ${po.challans[0].vehicleNumber}` : 'Pending shipment'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-500 uppercase block">2. Goods Receipt (GRN):</span>
                        <span className="font-bold text-emerald-800">
                          {po.goodsReceivedNotes?.[0]?.grnNumber || 'Pending Dock Arrival'}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {po.goodsReceivedNotes?.[0]?.inventoryUpdated ? '✓ Store stock updated' : 'Not yet inwarded'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-500 uppercase block">3. Vendor Invoice:</span>
                        <span className="font-bold text-blue-800">
                          {po.vendorInvoices?.[0]?.invoiceNumber || 'Pending Submission'}
                        </span>
                        <div className="mt-0.5">
                          <ThreeWayMatchBadge status={po.vendorInvoices?.[0]?.threeWayMatchStatus} />
                        </div>
                      </div>

                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] text-gray-500 uppercase block">4. Payment Settlement:</span>
                        <span className="font-bold text-emerald-900">
                          {po.vendorInvoices?.[0]?.payments?.[0]?.paymentNumber || 'Pending Settlement'}
                        </span>
                        <span className="text-[10px] text-gray-500 block">
                          {po.status === 'COMPLETED' ? '✓ Fully Settled' : 'Unpaid'}
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar — Timeline visible to all, operations strictly role-gated */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => setTrackerTargetId(po.id)}
                        className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Interactive 5-Step Stepper & Audit Trail
                      </button>

                      <div className="flex items-center gap-2">
                        {canVendorAct && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                            leftIcon={<Truck className="w-3.5 h-3.5" />}
                            onClick={() => setVendorTargetOrder(po)}
                          >
                            Vendor: Accept / Challan Dispatch
                          </Button>
                        )}

                        {canReceiveGoods && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            leftIcon={<PackageCheck className="w-3.5 h-3.5" />}
                            onClick={() => setGrnTargetOrder(po)}
                          >
                            Store: Gate Inspection & GRN
                          </Button>
                        )}

                        {canSubmitInvoice && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="bg-teal-600 hover:bg-teal-700 text-white"
                            leftIcon={<FileText className="w-3.5 h-3.5" />}
                            onClick={() => setSubmitInvoiceTargetOrder(po)}
                          >
                            Submit Vendor Invoice
                          </Button>
                        )}

                        {canPayInvoice && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                            leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                            onClick={() => setReviewInvoiceTarget(po.vendorInvoices![0])}
                          >
                            Accountant: 3-Way Match & Pay
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: DELIVERY CHALLANS
          ======================================================== */}
      {activeTab === 'CHALLANS' && (
        <div className="space-y-3">
          <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-700" />
              <span className="font-semibold text-purple-900">
                Vendor Delivery Challan Log — Tracking physical consignments en route to plant store dock.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {orders.flatMap((o) => (o.challans || []).map((ch) => ({ ...ch, parentOrderId: o.id }))).map((ch) => (
              <div key={ch.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {ch.challanNumber}
                    </span>
                    <span className="text-gray-500">Dispatch Date: {new Date(ch.dispatchDate).toLocaleDateString()}</span>
                  </div>
                  <P2PStatusBadge status={ch.status} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Vehicle:</span>
                    <span className="font-bold text-gray-800">{ch.vehicleNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Driver:</span>
                    <span className="font-semibold text-gray-800">{ch.driverName || 'N/A'} ({ch.driverPhone || '—'})</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Carrier / Tracking:</span>
                    <span className="font-semibold text-gray-800">{ch.transporterName || 'Direct'} • {ch.trackingNumber || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Dispatched Items:</span>
                    <span className="font-bold text-gray-800">{ch.items?.length || 0} consignment line(s)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setTrackerTargetId(ch.purchaseOrderId || ch.parentOrderId)}
                    className="text-xs text-purple-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View P2P Timeline & Audit Trail
                  </button>
                  <span className="text-[11px] text-gray-400">
                    Carrier: {ch.transporterName || 'Direct Plant Transit'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: GOODS RECEIVED NOTES (GRN)
          ======================================================== */}
      {activeTab === 'GRN' && (
        <div className="space-y-3">
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-emerald-900">
                Store Inward & Quality Inspection Log — Inwarded quantities automatically sync with Central Store Inventory.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {orders.flatMap((o) => (o.goodsReceivedNotes || []).map((grn) => ({ ...grn, parentOrderId: o.id }))).map((grn) => (
              <div key={grn.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {grn.grnNumber}
                    </span>
                    <span className="text-gray-500">Received on: {new Date(grn.receivedDate).toLocaleDateString()}</span>
                  </div>
                  <P2PStatusBadge status={grn.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Inspector / Receiver:</span>
                    <span className="font-semibold text-gray-800">
                      {grn.receiver ? `${grn.receiver.firstName} ${grn.receiver.lastName || ''}` : 'Store Manager'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Store Inventory Status:</span>
                    <span className="font-bold text-emerald-700">
                      {grn.inventoryUpdated ? '✓ Store Stock Updated (+)' : 'No Stock Adjustment'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Inspection Remarks:</span>
                    <span className="font-medium text-gray-700">{grn.inspectionRemarks || 'All checks passed'}</span>
                  </div>
                </div>

                {grn.rejectionReason && (
                  <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                    <strong>Rejection Notes:</strong> {grn.rejectionReason}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setTrackerTargetId(grn.purchaseOrderId || grn.parentOrderId)}
                    className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View P2P Timeline & Audit Trail
                  </button>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {grn.inventoryUpdated ? '✓ Central Store Stock Synchronized' : 'Stock pending inward'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: INVOICES, 3-WAY MATCH & PAYMENTS
          ======================================================== */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-3">
          <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-700" />
              <span className="font-semibold text-teal-900">
                Finance & Accounting — 3-Way Match Verification (PO vs GRN vs Invoice) and Bank Settlement.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {orders.flatMap((o) => (o.vendorInvoices || []).map((inv) => ({ ...inv, parentOrderId: o.id }))).map((inv) => (
              <div key={inv.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {inv.invoiceNumber}
                    </span>
                    <span className="font-bold text-gray-900">Supplier: {inv.supplier?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ThreeWayMatchBadge status={inv.threeWayMatchStatus} />
                    <P2PStatusBadge status={inv.status} />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-gray-400 block text-[10px]">Total Billed:</span>
                    <span className="text-sm font-black text-gray-900">₹{Number(inv.totalAmount).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Due Date:</span>
                    <span className="font-semibold text-gray-800">{new Date(inv.dueDate).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Audit Status:</span>
                    <span className="font-semibold text-gray-800">{inv.status}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px]">Settlement UTR:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {inv.payments?.[0]?.paymentNumber || 'Unsettled'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setTrackerTargetId(inv.purchaseOrderId || inv.parentOrderId)}
                    className="text-xs text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View P2P Timeline & Audit Trail
                  </button>

                  {canAccountantPay && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                      onClick={() => setReviewInvoiceTarget(inv)}
                    >
                      Review 3-Way Match & Pay
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          ALL INTERACTIVE MODAL DIALOGS
          ======================================================== */}

      {/* 1. Create Purchase Requisition (Store Manager) */}
      <CreatePRModal
        isOpen={isCreatePROpen}
        onClose={() => setIsCreatePROpen(false)}
        onSuccess={loadData}
      />

      {/* 2. Finalize Rates & Approve / Reject (Operational Manager) */}
      <FinalizeRatesModal
        isOpen={!!finalizeTargetPR}
        onClose={() => setFinalizeTargetPR(null)}
        requisition={finalizeTargetPR}
        onSuccess={loadData}
      />

      {/* 3. Issue Purchase Order (Store Manager / Ops Manager) */}
      <GeneratePOModal
        isOpen={!!generatePOTargetPR}
        onClose={() => setGeneratePOTargetPR(null)}
        requisition={generatePOTargetPR}
        onSuccess={loadData}
      />

      {/* 4. Vendor PO Accept/Reject & Delivery Challan Dispatch (Vendor) */}
      <VendorPOModal
        isOpen={!!vendorTargetOrder}
        onClose={() => setVendorTargetOrder(null)}
        order={vendorTargetOrder}
        onSuccess={loadData}
      />

      {/* 5. Goods Received Gate Inspection & Inwarding (Store Manager) */}
      <GoodsReceivedModal
        isOpen={!!grnTargetOrder}
        onClose={() => setGrnTargetOrder(null)}
        order={grnTargetOrder}
        onSuccess={loadData}
      />

      {/* 6. Submit Vendor Invoice (Vendor) */}
      <SubmitInvoiceModal
        isOpen={!!submitInvoiceTargetOrder}
        onClose={() => setSubmitInvoiceTargetOrder(null)}
        order={submitInvoiceTargetOrder}
        onSuccess={loadData}
      />

      {/* 7. Accountant 3-Way Match & Bank Payment (Accountant) */}
      <ReviewInvoiceModal
        isOpen={!!reviewInvoiceTarget}
        onClose={() => setReviewInvoiceTarget(null)}
        invoice={reviewInvoiceTarget}
        onSuccess={loadData}
      />

      {/* 8. Full End-to-End Cycle Tracker Modal (Available to All Roles) */}
      <CycleTrackerModal
        isOpen={!!trackerTargetId}
        onClose={() => setTrackerTargetId(null)}
        targetId={trackerTargetId}
      />
    </div>
  );
}
