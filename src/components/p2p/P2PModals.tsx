import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { P2PStatusBadge, ThreeWayMatchBadge, PriorityBadge } from './P2PStatusBadge';
import { P2PStepper } from './P2PStepper';
import { apiClient } from '@/lib/api-client';
import {
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Truck,
  PackageCheck,
  CreditCard,
  FileText,
  Clock,
  Building,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import {
  PurchaseRequisition,
  PurchaseOrder,
  DeliveryChallan,
  P2PGoodsReceived,
  VendorInvoice,
  P2PCycleTracker,
} from '@/types/p2p';

// ============================================================
// 1. CREATE PURCHASE REQUISITION MODAL (Store Manager)
// ============================================================
interface CreatePRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePRModal({ isOpen, onClose, onSuccess }: CreatePRModalProps) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [notes, setNotes] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [items, setItems] = useState<Array<{
    productId: string;
    itemName: string;
    requestedQuantity: number;
    unit: string;
    targetRate: number;
    notes: string;
  }>>([
    { productId: '', itemName: 'PET Preforms 1L (20g)', requestedQuantity: 5000, unit: 'pcs', targetRate: 6.5, notes: 'Food grade virgin PET' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      apiClient.getProducts().then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setProducts(res.data);
        }
      });
      // Default required date in 7 days
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setRequiredByDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { productId: '', itemName: '', requestedQuantity: 100, unit: 'units', targetRate: 0, notes: '' },
    ]);
  };

  const removeItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setItems((prev) =>
      prev.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [field]: val };
        if (field === 'productId') {
          const selectedProd = products.find((p) => p.id === val);
          if (selectedProd) {
            updated.itemName = selectedProd.name;
            updated.unit = selectedProd.unit || 'units';
            if (selectedProd.unitPrice) updated.targetRate = selectedProd.unitPrice;
          }
        }
        return updated;
      })
    );
  };

  const estimatedTotal = items.reduce(
    (sum, it) => sum + (Number(it.requestedQuantity) || 0) * (Number(it.targetRate) || 0),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a title for the requisition');
      return;
    }

    if (items.some((it) => !it.itemName.trim() || Number(it.requestedQuantity) <= 0)) {
      setError('Please ensure all items have a valid name and quantity greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createP2PRequisition({
        title,
        priority,
        requiredByDate,
        notes,
        items,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to create requisition');
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="New Purchase Requisition (Quantity Request)">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Input
              label="Requisition Title / Purpose"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Raw Materials Replenishment"
            />
          </div>
          <div>
            <Select
              label="Urgency / Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { label: 'Urgent (Line Stoppage Risk)', value: 'URGENT' },
                { label: 'High Priority', value: 'HIGH' },
                { label: 'Medium (Standard Restock)', value: 'MEDIUM' },
                { label: 'Low', value: 'LOW' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Required By Date"
            type="date"
            required
            value={requiredByDate}
            onChange={(e) => setRequiredByDate(e.target.value)}
          />
          <Input
            label="Notes / Justification for Operational Manager"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Current stock at 120 units, below 500 reorder point."
          />
        </div>

        {/* Dynamic Item List */}
        <div className="border border-gray-200 rounded-xl p-3 bg-gray-50/50 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
                Requested Items & Quantities (Step 1 of P2P)
              </h4>
              <p className="text-[11px] text-gray-500">
                Specify items needed from store. Operational Manager will review and negotiate finalized rates.
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div key={idx} className="bg-white border border-gray-200 p-3 rounded-lg shadow-2xs space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Existing Product</label>
                    <select
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-hidden focus:border-orange-500"
                      value={it.productId}
                      onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                    >
                      <option value="">-- Custom Raw Material --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.productCode || p.sku})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Item / Material Description</label>
                    <input
                      type="text"
                      required
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-hidden focus:border-orange-500 font-medium"
                      placeholder="e.g. PET Preforms 1L or Caps 28mm"
                      value={it.itemName}
                      onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-hidden focus:border-orange-500 font-bold"
                      value={it.requestedQuantity}
                      onChange={(e) => updateItem(idx, 'requestedQuantity', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-semibold text-gray-600 block mb-0.5">Unit</label>
                    <input
                      type="text"
                      className="w-full text-xs border border-gray-300 rounded px-1.5 py-1 bg-white focus:outline-hidden text-center"
                      value={it.unit}
                      onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-1 flex items-end justify-center pt-3 sm:pt-0">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Est. Target Rate:</span>
                    <input
                      type="number"
                      step="0.01"
                      className="w-24 border border-gray-300 rounded px-1.5 py-0.5 text-xs text-right font-semibold"
                      value={it.targetRate}
                      onChange={(e) => updateItem(idx, 'targetRate', e.target.value)}
                    />
                    <span className="text-gray-400">₹ / {it.unit}</span>
                  </div>
                  <div className="text-right text-gray-700 font-semibold">
                    Subtotal: ₹{((Number(it.requestedQuantity) || 0) * (Number(it.targetRate) || 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
            <span className="font-semibold text-gray-700">Estimated Total Value:</span>
            <span className="text-base font-black text-orange-600">₹{estimatedTotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            Submit Requisition for Rate Finalisation
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// 2. RATE FINALISATION & APPROVAL/REJECTION MODAL (Operational Manager)
// ============================================================
interface FinalizeRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: PurchaseRequisition | null;
  onSuccess: () => void;
}

export function FinalizeRatesModal({ isOpen, onClose, requisition, onSuccess }: FinalizeRatesModalProps) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && requisition) {
      apiClient.getSuppliers().then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setSuppliers(res.data);
          if (!selectedSupplierId && res.data.length > 0) {
            setSelectedSupplierId(requisition.supplierId || res.data[0].id);
          }
        }
      });

      const initialRates: Record<string, number> = {};
      requisition.items?.forEach((it) => {
        initialRates[it.id] = Number(it.finalizedRate || it.targetRate || 0);
      });
      setRates(initialRates);
      setShowRejectForm(false);
      setRejectionReason('');
      setRemarks(requisition.rateApprovalRemarks || 'Rates negotiated and approved with vendor');
    }
  }, [isOpen, requisition]);

  if (!requisition) return null;

  const totalFinalized = requisition.items?.reduce((sum, it) => {
    const rate = rates[it.id] || 0;
    return sum + rate * it.requestedQuantity;
  }, 0) || 0;

  const handleApprove = async () => {
    setError('');
    if (!selectedSupplierId) {
      setError('Please select a supplier/vendor to fulfill this requisition');
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = requisition.items.map((it) => ({
        id: it.id,
        finalizedRate: Number(rates[it.id] || 0),
      }));

      const res = await apiClient.finalizeP2PRates(requisition.id, {
        supplierId: selectedSupplierId,
        rateApprovalRemarks: remarks,
        items: itemsPayload,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to approve rates');
      }
    } catch (err: any) {
      setError(err?.message || 'Error finalizing rates');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setError('');
    if (!rejectionReason.trim()) {
      setError('Mandatory: Please specify a reason for rejecting this requisition');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.rejectP2PRequisition(requisition.id, rejectionReason);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to reject requisition');
      }
    } catch (err: any) {
      setError(err?.message || 'Error rejecting requisition');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Rate Finalisation & Approval — ${requisition.prNumber}`}
      subtitle="Operational Manager review: Select vendor, finalize unit rates, and approve or reject requisition."
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PR Summary Card */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px]">Title:</span>
            <span className="font-bold text-gray-900">{requisition.title}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Requested By:</span>
            <span className="font-semibold text-gray-800">
              {requisition.requester ? `${requisition.requester.firstName} ${requisition.requester.lastName || ''}` : 'Store Manager'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Priority:</span>
            <PriorityBadge priority={requisition.priority} />
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Current Status:</span>
            <P2PStatusBadge status={requisition.status} />
          </div>
        </div>

        {!showRejectForm ? (
          <>
            {/* Vendor Selection */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-1">
                Select Approved Vendor / Supplier
              </label>
              <select
                className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white font-medium focus:ring-2 focus:ring-orange-500"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                <option value="">-- Choose Vendor / Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.supplierCode}) • {s.email || 'No email'}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Rates Negotiation Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100/70 px-3 py-2 border-b border-gray-200 flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Items & Finalized Rates</span>
                <span>Finalized Total: ₹{totalFinalized.toLocaleString()}</span>
              </div>

              <div className="p-3 space-y-2 bg-white max-h-56 overflow-y-auto">
                {requisition.items?.map((it) => {
                  const currentRate = rates[it.id] !== undefined ? rates[it.id] : (it.targetRate || 0);
                  const lineTotal = currentRate * it.requestedQuantity;

                  return (
                    <div key={it.id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-bold text-gray-900">{it.itemName}</div>
                        <div className="text-[11px] text-gray-500">
                          Qty Requested: <strong className="text-gray-800">{it.requestedQuantity} {it.unit}</strong> • Target: ₹{Number(it.targetRate || 0)}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-gray-500">Finalized Rate (₹):</span>
                          <input
                            type="number"
                            step="0.01"
                            className="w-24 text-xs font-bold border border-gray-300 rounded px-2 py-1 text-right focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                            value={currentRate}
                            onChange={(e) =>
                              setRates((prev) => ({
                                ...prev,
                                [it.id]: parseFloat(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                        <span className="text-xs font-black text-gray-900 w-24 text-right">
                          ₹{lineTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Input
              label="Operational Manager Approval Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Price negotiated down by 5%; volume discount approved."
            />

            {/* Accept or Reject Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                className="text-rose-700 border-rose-300 hover:bg-rose-50"
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => setShowRejectForm(true)}
              >
                Reject Requisition
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  loading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleApprove}
                >
                  Approve Rates & Finalize (₹{totalFinalized.toLocaleString()})
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Rejection Form */
          <div className="space-y-3 p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Confirm Rejection of Requisition {requisition.prNumber}</span>
            </div>
            <p className="text-xs text-rose-700">
              Rejecting this requisition will halt the procurement cycle. Store Manager will be notified with your reason.
            </p>

            <Input
              label="Mandatory Rejection Reason"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Material rates exceeding budget allocation / Sufficient inventory in Annex store."
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowRejectForm(false)} disabled={isSubmitting}>
                Back to Rate Approval
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={isSubmitting}
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={handleReject}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// 3. GENERATE PURCHASE ORDER MODAL (Store Manager / Ops Manager)
// ============================================================
interface GeneratePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisition: PurchaseRequisition | null;
  onSuccess: () => void;
}

export function GeneratePOModal({ isOpen, onClose, requisition, onSuccess }: GeneratePOModalProps) {
  const [expectedDate, setExpectedDate] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30 Days');
  const [deliveryTerms, setDeliveryTerms] = useState('FOB Plant Gate Store');
  const [taxRate, setTaxRate] = useState(18);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      setExpectedDate(d.toISOString().split('T')[0]);
    }
  }, [isOpen]);

  if (!requisition) return null;

  const subtotal = Number(requisition.finalizedTotal || requisition.estimatedTotal || 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiClient.generateP2POrder(requisition.id, {
        supplierId: requisition.supplierId || undefined,
        expectedDeliveryDate: expectedDate,
        paymentTerms,
        deliveryTerms,
        taxRate,
        notes,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to issue Purchase Order');
      }
    } catch (err: any) {
      setError(err?.message || 'Error generating Purchase Order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={`Issue Purchase Order for ${requisition.prNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-500 block text-[10px]">Vendor / Supplier:</span>
            <span className="font-bold text-gray-900">{requisition.supplier?.name || 'Selected Supplier'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Approved Subtotal:</span>
            <span className="font-bold text-gray-900">₹{subtotal.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Expected Delivery Date"
            type="date"
            required
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
          <Select
            label="Payment Terms"
            value={paymentTerms}
            onChange={(e) => setPaymentTerms(e.target.value)}
            options={[
              { label: 'Net 30 Days (Standard)', value: 'Net 30 Days' },
              { label: 'Net 15 Days', value: 'Net 15 Days' },
              { label: 'Payment Upon GRN Acceptance', value: 'Payment Upon GRN' },
              { label: 'Advance 50% / Balance Upon GRN', value: 'Advance 50%' },
              { label: 'Cash on Delivery (COD)', value: 'COD' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            label="Delivery Terms / Destination"
            value={deliveryTerms}
            onChange={(e) => setDeliveryTerms(e.target.value)}
            placeholder="e.g. FOB Plant Store Gate 2"
          />
          <Select
            label="Applicable GST / Tax Rate"
            value={String(taxRate)}
            onChange={(e) => setTaxRate(Number(e.target.value))}
            options={[
              { label: '18% GST (Standard Materials)', value: '18' },
              { label: '12% GST', value: '12' },
              { label: '5% GST (Packaging / Food grade)', value: '5' },
              { label: '0% (Exempt)', value: '0' },
            ]}
          />
        </div>

        {/* Calculation Summary */}
        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Material Subtotal:</span>
            <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Estimated Tax ({taxRate}%):</span>
            <span className="font-semibold">₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-1 border-t border-gray-200">
            <span>Total Purchase Order Value:</span>
            <span className="text-orange-600 font-black">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <Input
          label="Purchase Order Remarks / Special Instructions"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Quality inspection certificate required with delivery challan."
        />

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} leftIcon={<FileText className="w-4 h-4" />}>
            Generate & Issue PO to Vendor
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// 4. VENDOR PO ACCEPT / REJECT & DELIVERY CHALLAN MODAL (Vendor)
// ============================================================
interface VendorPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onSuccess: () => void;
}

export function VendorPOModal({ isOpen, onClose, order, onSuccess }: VendorPOModalProps) {
  const [mode, setMode] = useState<'VIEW' | 'REJECT' | 'CHALLAN'>('VIEW');
  const [rejectReason, setRejectReason] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('MH-12-AB-4509');
  const [driverName, setDriverName] = useState('Ramesh Shinde');
  const [driverPhone, setDriverPhone] = useState('+91 98220 12345');
  const [transporterName, setTransporterName] = useState('Om Sai Logistics');
  const [trackingNumber, setTrackingNumber] = useState('OSL-' + Math.floor(100000 + Math.random() * 900000));
  const [markOutForDelivery, setMarkOutForDelivery] = useState(true);
  const [challanNotes, setChallanNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode('VIEW');
      setError('');
      setRejectReason('');
    }
  }, [isOpen]);

  if (!order) return null;

  const handleAcceptPO = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await apiClient.vendorAcceptP2POrder(order.id);
      if (res.success) {
        onSuccess();
        setMode('CHALLAN');
      } else {
        setError(res.message || 'Failed to accept PO');
      }
    } catch (err: any) {
      setError(err?.message || 'Error accepting PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectPO = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejecting the order');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await apiClient.vendorRejectP2POrder(order.id, rejectReason);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to reject PO');
      }
    } catch (err: any) {
      setError(err?.message || 'Error rejecting PO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await apiClient.createP2PChallan(order.id, {
        vehicleNumber,
        driverName,
        driverPhone,
        transporterName,
        trackingNumber,
        notes: challanNotes,
        markOutForDelivery,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to create challan');
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Vendor Portal — Order ${order.poNumber}`}
      subtitle="Vendor fulfillment workflow: Accept/Reject Order → Generate Delivery Challan → Dispatch Out for Delivery"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* PO Snapshot */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-gray-500 block text-[10px]">PO Total Value:</span>
            <span className="text-sm font-black text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Payment Terms:</span>
            <span className="font-semibold text-gray-800">{order.paymentTerms || 'Net 30'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Delivery To:</span>
            <span className="font-semibold text-gray-800">{order.deliveryTerms || 'Plant Gate Store'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Status:</span>
            <P2PStatusBadge status={order.status} />
          </div>
        </div>

        {/* Mode 1: Standard Review & Accept / Reject */}
        {mode === 'VIEW' && (
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100/70 px-3 py-2 border-b border-gray-200 text-xs font-bold text-gray-700">
                Order Items & Agreed Rates
              </div>
              <div className="p-3 space-y-2 bg-white max-h-48 overflow-y-auto">
                {order.items?.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-2 rounded bg-gray-50/60 text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{it.itemName}</span>
                      <span className="text-gray-500 ml-2">
                        {it.quantity} {it.unit} @ ₹{Number(it.unitPrice).toFixed(2)}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">₹{Number(it.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.status === 'ISSUED' && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  className="text-rose-700 border-rose-300 hover:bg-rose-50"
                  leftIcon={<XCircle className="w-4 h-4" />}
                  onClick={() => setMode('REJECT')}
                >
                  Reject Order
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Close
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    loading={isSubmitting}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    onClick={handleAcceptPO}
                  >
                    Accept Purchase Order
                  </Button>
                </div>
              </div>
            )}

            {(order.status === 'VENDOR_ACCEPTED' || order.status === 'CHALLAN_CREATED') && (
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <Button type="button" variant="outline" onClick={onClose}>
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  leftIcon={<Truck className="w-4 h-4" />}
                  onClick={() => setMode('CHALLAN')}
                >
                  Generate Delivery Challan & Dispatch
                </Button>
              </div>
            )}

            {order.status === 'OUT_FOR_DELIVERY' && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-orange-600 animate-bounce" />
                  <span>Shipment is currently <strong>Out for Delivery</strong> to Store receiving dock.</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Done
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Reject Order Form */}
        {mode === 'REJECT' && (
          <div className="space-y-3 p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Vendor Rejection of PO {order.poNumber}
            </h4>
            <Input
              label="Reason for Rejecting Order"
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Raw material stock unavailable / Delivery schedule cannot be met."
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setMode('VIEW')}>
                Back
              </Button>
              <Button type="button" variant="danger" loading={isSubmitting} onClick={handleRejectPO}>
                Confirm Order Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Mode 3: Create Delivery Challan & Dispatch Form */}
        {mode === 'CHALLAN' && (
          <form onSubmit={handleCreateChallan} className="space-y-3">
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-xl text-xs">
              <span className="font-bold text-purple-900 block mb-0.5">Delivery Challan Generation (Step 3)</span>
              <p className="text-purple-700">Enter logistics, driver, and vehicle details to dispatch the consignment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Vehicle Registration Number"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                placeholder="e.g. MH-12-AB-4509"
              />
              <Input
                label="Driver Full Name"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Ramesh Shinde"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Driver Mobile Number"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="+91 98220 12345"
              />
              <Input
                label="Transporter / Carrier Agency"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                placeholder="e.g. Om Sai Logistics"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="LR / Docket / Tracking #"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
              <Input
                label="Challan Notes"
                value={challanNotes}
                onChange={(e) => setChallanNotes(e.target.value)}
                placeholder="e.g. Handle with care; packed in moisture-proof shrink."
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
              <input
                type="checkbox"
                id="outForDeliveryCheck"
                checked={markOutForDelivery}
                onChange={(e) => setMarkOutForDelivery(e.target.checked)}
                className="w-4 h-4 text-orange-600 rounded border-gray-300"
              />
              <label htmlFor="outForDeliveryCheck" className="text-gray-800 font-semibold cursor-pointer">
                Immediately mark shipment as "Out for Delivery" (notifies Store Manager dock)
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setMode('VIEW')} disabled={isSubmitting}>
                Back
              </Button>
              <Button type="submit" variant="primary" loading={isSubmitting} leftIcon={<Truck className="w-4 h-4" />}>
                Create Challan & Dispatch Consignment
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// 5. GOODS RECEIVED & INSPECTION MODAL (Store Manager)
// ============================================================
interface GoodsReceivedModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onSuccess: () => void;
}

export function GoodsReceivedModal({ isOpen, onClose, order, onSuccess }: GoodsReceivedModalProps) {
  const [inspectionRemarks, setInspectionRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [itemReceipts, setItemReceipts] = useState<Record<string, { received: number; accepted: number; rejected: number; condition: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      setIsRejectMode(false);
      setError('');
      setRejectionReason('');
      setInspectionRemarks('Physical count verified. Quality and packaging intact. Gate inward clearance approved.');

      const initial: Record<string, { received: number; accepted: number; rejected: number; condition: string }> = {};
      order.items?.forEach((it) => {
        initial[it.id] = {
          received: it.quantity,
          accepted: it.quantity,
          rejected: 0,
          condition: 'GOOD',
        };
      });
      setItemReceipts(initial);
    }
  }, [isOpen, order]);

  if (!order) return null;

  const updateReceipt = (id: string, field: string, val: any) => {
    setItemReceipts((prev) => {
      const current = prev[id] || { received: 0, accepted: 0, rejected: 0, condition: 'GOOD' };
      const updated = { ...current, [field]: val };
      if (field === 'received') {
        updated.accepted = Number(val);
        updated.rejected = 0;
      } else if (field === 'accepted') {
        updated.rejected = Math.max(0, current.received - Number(val));
      }
      return { ...prev, [id]: updated };
    });
  };

  const handleAcceptGoods = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const payloadItems = order.items.map((it) => {
        const rc = itemReceipts[it.id] || { received: it.quantity, accepted: it.quantity, rejected: 0, condition: 'GOOD' };
        return {
          purchaseOrderItemId: it.id,
          productId: it.productId,
          itemName: it.itemName,
          orderedQuantity: it.quantity,
          dispatchedQuantity: it.quantity,
          receivedQuantity: Number(rc.received),
          acceptedQuantity: Number(rc.accepted),
          rejectedQuantity: Number(rc.rejected),
          unit: it.unit,
          condition: rc.condition,
        };
      });

      const res = await apiClient.processP2PGoodsReceived(order.id, {
        challanId: order.challans?.[0]?.id,
        inspectionRemarks,
        isAccepted: true,
        items: payloadItems,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to process goods received');
      }
    } catch (err: any) {
      setError(err?.message || 'Error processing goods received');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectGoods = async () => {
    if (!rejectionReason.trim()) {
      setError('Mandatory: Please specify a reason for rejecting the physical consignment');
      return;
    }
    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiClient.processP2PGoodsReceived(order.id, {
        challanId: order.challans?.[0]?.id,
        inspectionRemarks,
        isAccepted: false,
        rejectionReason,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to record goods rejection');
      }
    } catch (err: any) {
      setError(err?.message || 'Error recording goods rejection');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Goods Receipt & Gate Inspection — ${order.poNumber}`}
      subtitle="Store Manager Verification: Inspect physical goods against Challan & PO. Accepting automatically updates central store inventory."
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Challan Info Banner */}
        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <span className="text-gray-500 block text-[10px]">Challan Number:</span>
            <span className="font-bold text-gray-900">{order.challans?.[0]?.challanNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Vehicle #:</span>
            <span className="font-bold text-gray-900">{order.challans?.[0]?.vehicleNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Supplier:</span>
            <span className="font-semibold text-gray-800">{order.supplier?.name}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Consignment Status:</span>
            <P2PStatusBadge status={order.status} />
          </div>
        </div>

        {!isRejectMode ? (
          <>
            {/* Inspection Item Rows */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-100/80 px-3 py-2 border-b border-gray-200 text-xs font-bold text-gray-700 flex justify-between">
                <span>Items Inspection Check</span>
                <span className="text-[11px] font-normal text-gray-500">Accepted count increments Store Stock</span>
              </div>

              <div className="p-3 space-y-3 bg-white max-h-60 overflow-y-auto">
                {order.items?.map((it) => {
                  const rc = itemReceipts[it.id] || { received: it.quantity, accepted: it.quantity, rejected: 0, condition: 'GOOD' };

                  return (
                    <div key={it.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-gray-900">{it.itemName}</span>
                          <span className="text-gray-500 text-[11px] ml-2">Ordered: {it.quantity} {it.unit}</span>
                        </div>
                        <select
                          className="text-[11px] border border-gray-300 rounded px-2 py-0.5 bg-white font-medium"
                          value={rc.condition}
                          onChange={(e) => updateReceipt(it.id, 'condition', e.target.value)}
                        >
                          <option value="GOOD">Good Condition (Passed)</option>
                          <option value="DAMAGED">Damaged in Transit</option>
                          <option value="DEFECTIVE">Quality Defective</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100 text-[11px]">
                        <div>
                          <label className="text-gray-500 block">Received Count:</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full border border-gray-300 rounded px-2 py-0.5 text-xs font-semibold bg-white"
                            value={rc.received}
                            onChange={(e) => updateReceipt(it.id, 'received', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="text-emerald-700 font-medium block">Accepted to Stock:</label>
                          <input
                            type="number"
                            min="0"
                            max={rc.received}
                            className="w-full border border-emerald-300 rounded px-2 py-0.5 text-xs font-bold text-emerald-800 bg-emerald-50/50"
                            value={rc.accepted}
                            onChange={(e) => updateReceipt(it.id, 'accepted', e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="text-rose-700 font-medium block">Rejected / Damaged:</label>
                          <input
                            type="number"
                            min="0"
                            className="w-full border border-rose-300 rounded px-2 py-0.5 text-xs font-bold text-rose-800 bg-rose-50/50"
                            value={rc.rejected}
                            onChange={(e) => updateReceipt(it.id, 'rejected', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Input
              label="Store Inward / Inspection Remarks"
              value={inspectionRemarks}
              onChange={(e) => setInspectionRemarks(e.target.value)}
              placeholder="e.g. Seal checked, batch certificate verified, all units counted and shelved."
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                className="text-rose-700 border-rose-300 hover:bg-rose-50"
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => setIsRejectMode(true)}
              >
                Reject Entire Delivery
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  loading={isSubmitting}
                  leftIcon={<PackageCheck className="w-4 h-4" />}
                  onClick={handleAcceptGoods}
                >
                  Accept Goods & Update Store Inventory
                </Button>
              </div>
            </div>
          </>
        ) : (
          /* Rejection Mode */
          <div className="space-y-3 p-4 bg-rose-50/80 border border-rose-200 rounded-xl text-xs">
            <h4 className="font-bold text-rose-800 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Reject Consignment at Store Dock
            </h4>
            <p className="text-rose-700">
              This will record a rejection GRN and notify the Vendor and Accountant. Store inventory will NOT be updated.
            </p>

            <Input
              label="Reason for Delivery Rejection"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Moisture damage in transit / Incorrect cap threading / Broken preforms."
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsRejectMode(false)} disabled={isSubmitting}>
                Back to Inspection
              </Button>
              <Button type="button" variant="danger" loading={isSubmitting} onClick={handleRejectGoods}>
                Confirm Delivery Rejection
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// 6. SUBMIT VENDOR INVOICE MODAL (Vendor / Accountant)
// ============================================================
interface SubmitInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onSuccess: () => void;
}

export function SubmitInvoiceModal({ isOpen, onClose, order, onSuccess }: SubmitInvoiceModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && order) {
      setInvoiceNumber(`VINV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      const today = new Date().toISOString().split('T')[0];
      setInvoiceDate(today);

      const due = new Date();
      due.setDate(due.getDate() + 30);
      setDueDate(due.toISOString().split('T')[0]);

      setSubtotal(Number(order.subtotal || 0));
      setTaxAmount(Number(order.taxAmount || 0));
      setTotalAmount(Number(order.totalAmount || 0));
    }
  }, [isOpen, order]);

  if (!order) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setError('Invoice number is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await apiClient.submitP2PVendorInvoice(order.id, {
        invoiceNumber,
        invoiceDate,
        dueDate,
        subtotal,
        taxAmount,
        totalAmount,
        accountantRemarks: remarks,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to submit invoice');
      }
    } catch (err: any) {
      setError(err?.message || 'Error submitting invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={`Submit Vendor Invoice — ${order.poNumber}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-500 block text-[10px]">Vendor:</span>
            <span className="font-bold text-gray-900">{order.supplier?.name}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px]">Agreed PO Total:</span>
            <span className="font-bold text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Invoice Number"
            required
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
          <Input
            label="Invoice Date"
            type="date"
            required
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
          <Input
            label="Payment Due Date"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            label="Subtotal (₹)"
            type="number"
            step="0.01"
            required
            value={subtotal}
            onChange={(e) => {
              const sub = parseFloat(e.target.value) || 0;
              setSubtotal(sub);
              setTotalAmount(sub + taxAmount);
            }}
          />
          <Input
            label="Tax Amount (₹)"
            type="number"
            step="0.01"
            value={taxAmount}
            onChange={(e) => {
              const tx = parseFloat(e.target.value) || 0;
              setTaxAmount(tx);
              setTotalAmount(subtotal + tx);
            }}
          />
          <Input
            label="Total Billed Amount (₹)"
            type="number"
            step="0.01"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
          />
        </div>

        <Input
          label="Remarks / Bank Reference Notes"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          placeholder="e.g. Bank details provided on invoice copy."
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} leftIcon={<CreditCard className="w-4 h-4" />}>
            Submit Invoice for Accountant Audit
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// 7. 3-WAY MATCH & INVOICE REVIEW / PAYMENT MODAL (Accountant)
// ============================================================
interface ReviewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: VendorInvoice | null;
  onSuccess: () => void;
}

export function ReviewInvoiceModal({ isOpen, onClose, invoice, onSuccess }: ReviewInvoiceModalProps) {
  const [actionTab, setActionTab] = useState<'MATCH' | 'PAYMENT' | 'REJECT'>('MATCH');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentRemarks, setPaymentRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && invoice) {
      setActionTab(invoice.status === 'APPROVED' ? 'PAYMENT' : 'MATCH');
      setPaymentAmount(Number(invoice.totalAmount || 0));
      setReferenceNumber(`UTR-AXIS-${Math.floor(10000000 + Math.random() * 90000000)}`);
      setPaymentRemarks(`Settlement for Vendor Invoice ${invoice.invoiceNumber}`);
      setError('');
    }
  }, [isOpen, invoice]);

  if (!invoice) return null;

  const po = invoice.purchaseOrder;
  const poTotal = Number(po?.totalAmount || 0);
  const invoiceTotal = Number(invoice.totalAmount || 0);
  const matchDifference = Math.abs(invoiceTotal - poTotal);
  const isMatchGood = matchDifference <= 5.0;

  const handleApproveInvoice = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const res = await apiClient.reviewP2PVendorInvoice(invoice.id, {
        action: 'APPROVE',
        remarks: reviewRemarks || '3-Way Match Verified (PO, GRN, and Invoice match 100%)',
      });
      if (res.success) {
        onSuccess();
        setActionTab('PAYMENT');
      } else {
        setError(res.message || 'Failed to approve invoice');
      }
    } catch (err: any) {
      setError(err?.message || 'Error approving invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectInvoice = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejecting the invoice');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const res = await apiClient.reviewP2PVendorInvoice(invoice.id, {
        action: 'REJECT',
        rejectionReason,
      });
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to reject invoice');
      }
    } catch (err: any) {
      setError(err?.message || 'Error rejecting invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await apiClient.recordP2PPayment(invoice.id, {
        amount: paymentAmount,
        paymentMethod,
        referenceNumber,
        remarks: paymentRemarks,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message || 'Failed to process payment');
      }
    } catch (err: any) {
      setError(err?.message || 'Error processing payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Accountant 3-Way Match & Settlement — ${invoice.invoiceNumber}`}
      subtitle="Verify Purchase Order vs Goods Received (GRN) vs Vendor Invoice, and execute bank payment."
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 3-Way Match Comparison Card */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/40 border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-gray-900">3-Way Match Audit Verification:</span>
              <ThreeWayMatchBadge status={isMatchGood ? 'MATCHED' : 'DISCREPANCY'} />
            </div>
            <P2PStatusBadge status={invoice.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                1. Purchase Order
              </div>
              <div className="font-mono font-bold text-gray-800">{po?.poNumber || 'N/A'}</div>
              <div className="text-sm font-black text-gray-900 mt-1">₹{poTotal.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500">Agreed contract price</div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1 flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" />
                2. Goods Received (GRN)
              </div>
              <div className="font-mono font-bold text-emerald-700">
                {po?.goodsReceivedNotes?.[0]?.grnNumber || 'Verified in Store'}
              </div>
              <div className="text-sm font-black text-emerald-800 mt-1">
                {po?.goodsReceivedNotes?.[0]?.status === 'ACCEPTED' ? '100% Inwarded' : 'Inspected'}
              </div>
              <div className="text-[10px] text-gray-500">Central stock updated</div>
            </div>

            <div className="p-2.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
              <div className="text-[10px] font-semibold uppercase text-gray-500 mb-1 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                3. Vendor Invoice
              </div>
              <div className="font-mono font-bold text-blue-700">{invoice.invoiceNumber}</div>
              <div className="text-sm font-black text-gray-900 mt-1">₹{invoiceTotal.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500">
                {isMatchGood ? (
                  <span className="text-emerald-700 font-semibold">Matched (Zero Variance)</span>
                ) : (
                  <span className="text-red-700 font-semibold">Variance: ₹{matchDifference.toFixed(2)}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tab 1: Review & Approve / Reject */}
        {actionTab === 'MATCH' && (
          <div className="space-y-3">
            <Input
              label="Accountant Audit Remarks"
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              placeholder="e.g. 3-Way Match verified against GRN. Ready for disbursement."
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                className="text-rose-700 border-rose-300 hover:bg-rose-50"
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => setActionTab('REJECT')}
              >
                Reject Invoice
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                  Close
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  loading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleApproveInvoice}
                >
                  Approve Invoice for Payment
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Reject Invoice */}
        {actionTab === 'REJECT' && (
          <div className="space-y-3 p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
            <h4 className="text-xs font-bold text-rose-800 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              Reject Vendor Invoice {invoice.invoiceNumber}
            </h4>
            <Input
              label="Reason for Rejecting Invoice"
              required
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Rate variance against approved PO / Missing tax identification / Overbilled quantity."
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setActionTab('MATCH')}>
                Back
              </Button>
              <Button type="button" variant="danger" loading={isSubmitting} onClick={handleRejectInvoice}>
                Confirm Invoice Rejection
              </Button>
            </div>
          </div>
        )}

        {/* Tab 3: Process Bank Payment */}
        {actionTab === 'PAYMENT' && (
          <form onSubmit={handleProcessPayment} className="space-y-3 p-4 bg-emerald-50/40 border border-emerald-200 rounded-xl">
            <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
              <div>
                <span className="font-bold text-xs text-emerald-900 block">Process Bank Settlement (Step 5 of P2P)</span>
                <span className="text-[11px] text-emerald-700">Disburse approved funds to Vendor bank account.</span>
              </div>
              <span className="text-xs font-bold text-gray-500">Payee: {invoice.supplier?.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Payment Amount (₹)"
                type="number"
                step="0.01"
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
              />
              <Select
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                options={[
                  { label: 'Bank Transfer (NEFT / RTGS)', value: 'BANK_TRANSFER' },
                  { label: 'UPI / Immediate Payment', value: 'UPI' },
                  { label: 'Cheque / DD', value: 'CHEQUE' },
                  { label: 'Cash', value: 'CASH' },
                ]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Bank Reference / UTR Number"
                required
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. UTR-AXIS-99238472"
              />
              <Input
                label="Payment Ledger Remarks"
                value={paymentRemarks}
                onChange={(e) => setPaymentRemarks(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-200">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                loading={isSubmitting}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                Confirm Payment & Complete P2P Cycle (₹{paymentAmount.toLocaleString()})
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}

// ============================================================
// 8. FULL END-TO-END CYCLE TRACKER MODAL (Visible to All Roles & Admin)
// ============================================================
interface CycleTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string | null;
}

export function CycleTrackerModal({ isOpen, onClose, targetId }: CycleTrackerModalProps) {
  const [tracker, setTracker] = useState<P2PCycleTracker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && targetId) {
      setIsLoading(true);
      setError('');
      apiClient
        .getP2PTracker(targetId)
        .then((res) => {
          if (res.success && res.data) {
            setTracker(res.data);
          } else {
            setError(res.message || 'Cycle tracker record not found');
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, targetId]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`P2P Lifecycle Audit & Progress Tracker`}
      subtitle="Complete chronological audit trail across Store Manager, Operational Manager, Vendor, and Accountant."
    >
      <div className="space-y-4">
        {isLoading && (
          <div className="p-8 text-center text-xs text-gray-500 animate-pulse">
            Loading P2P lifecycle timeline...
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {tracker && (
          <>
            <P2PStepper
              steps={tracker.steps}
              currentOverallStatus={tracker.overallStatus}
            />

            {/* Document References & Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs space-y-3">
              <h4 className="font-bold text-gray-900 text-sm">Linked Documents & Milestones:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase">1. Requisition:</span>
                  <span className="font-bold text-gray-900 font-mono">
                    {tracker.purchaseRequisition?.prNumber || 'N/A'}
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {tracker.purchaseRequisition?.title || 'Requisition'}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase">2. Purchase Order:</span>
                  <span className="font-bold text-indigo-700 font-mono">
                    {tracker.purchaseOrder?.poNumber || 'Pending'}
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {tracker.purchaseOrder?.supplier?.name || 'Assigned Vendor'}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase">3. Delivery Challan:</span>
                  <span className="font-bold text-purple-700 font-mono">
                    {tracker.purchaseOrder?.challans?.[0]?.challanNumber || 'Pending'}
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {tracker.purchaseOrder?.challans?.[0]?.vehicleNumber || 'Vehicle'}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase">4. Goods Receipt Note:</span>
                  <span className="font-bold text-emerald-700 font-mono">
                    {tracker.purchaseOrder?.goodsReceivedNotes?.[0]?.grnNumber || 'Pending'}
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {tracker.purchaseOrder?.goodsReceivedNotes?.[0]?.status === 'ACCEPTED' ? '✓ Inwarded' : 'Gate Inspection'}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase">5. Vendor Invoice:</span>
                  <span className="font-bold text-blue-700 font-mono">
                    {tracker.purchaseOrder?.vendorInvoices?.[0]?.invoiceNumber || 'Pending'}
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {tracker.purchaseOrder?.vendorInvoices?.[0]?.threeWayMatchStatus ? `Match: ${tracker.purchaseOrder.vendorInvoices[0].threeWayMatchStatus}` : 'Awaiting bill'}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-gray-200">
                  <span className="text-[10px] text-gray-500 block uppercase">6. Payment UTR:</span>
                  <span className="font-bold text-emerald-800 font-mono">
                    {tracker.purchaseOrder?.vendorInvoices?.[0]?.payments?.[0]?.paymentNumber || 'Pending'}
                  </span>
                  <span className="text-[11px] text-gray-500 block truncate">
                    {tracker.overallStatus === 'COMPLETED' ? '✓ Fully Settled' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>

            {/* Chronological Audit Trail & Action History */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>📜 Chronological Lifecycle Audit Trail</span>
                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    Read-Only Audit Trail
                  </span>
                </h4>
                <span className="text-[11px] text-gray-500">
                  Total Milestone Steps: {tracker.steps.length}
                </span>
              </div>

              <div className="space-y-2">
                {tracker.steps.map((st) => (
                  <div
                    key={st.stepIndex}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white border border-gray-300 font-bold text-[10px] flex items-center justify-center text-gray-700">
                        {st.stepIndex}
                      </span>
                      <div>
                        <span className="font-bold text-gray-900">{st.stepName}</span>
                        <span className="text-gray-400 mx-1.5">•</span>
                        <span className="text-gray-600 font-medium">Role: {st.roleName}</span>
                        {st.code && st.code !== 'N/A' && (
                          <span className="ml-2 font-mono text-[10px] text-orange-600 font-semibold bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                            {st.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {st.remarks && (
                        <span className="text-[11px] text-gray-500 italic truncate max-w-xs" title={st.remarks}>
                          "{st.remarks}"
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          st.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : st.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : st.status === 'IN_PROGRESS'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        {st.status}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono whitespace-nowrap">
                        {st.timestamp ? new Date(st.timestamp).toLocaleString() : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Close Tracker
          </Button>
        </div>
      </div>
    </Modal>
  );
}
