'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ArrowRight } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { showToast } from '@/lib/api';
import { productionService } from '../../services/productionService';
import type { Production, ProductionStatus } from '../../types';

export const ProductionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const listHref = location.pathname.startsWith('/manager')
    ? '/manager/production'
    : location.pathname.startsWith('/admin')
    ? '/admin/production'
    : '/production';
  const [batch, setBatch] = useState<Production | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Cancellation Modal state
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const loadBatch = async (batchId: string) => {
    const res = await productionService.getProductionById(batchId);
    if (res.success && res.data) {
      setBatch(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (id) {
      loadBatch(id);
    }
  }, [id]);

  const handleStatusUpdate = async (newStatus: ProductionStatus, remarks?: string) => {
    const targetId = batch?.id || id;
    if (!targetId) return;

    setIsUpdatingStatus(true);
    const res = await productionService.updateProductionStatus(targetId, newStatus, remarks);
    setIsUpdatingStatus(false);

    if (res.success && res.data) {
      setBatch(res.data);
      showToast(`Batch status updated to ${newStatus.replace('_', ' ')}`, 'success');
    } else {
      showToast(res.message || 'Failed to update batch status', 'error');
    }
  };

  const openCancelModal = () => {
    setCancellationReason('');
    setCancelError('');
    setIsCancelModalOpen(true);
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = batch?.id || id;
    if (!targetId) return;

    const trimmedReason = cancellationReason.trim();
    if (!trimmedReason) {
      setCancelError('Please provide a reason for cancelling this batch.');
      return;
    }

    setIsCancelling(true);
    setCancelError('');

    const res = await productionService.updateProductionStatus(targetId, 'CANCELLED', trimmedReason);
    setIsCancelling(false);

    if (res.success && res.data) {
      setBatch(res.data);
      setIsCancelModalOpen(false);
      showToast(`Batch #${batch?.batchNumber || ''} cancelled successfully`, 'success');
    } else {
      const err = res.message || 'Failed to cancel production batch';
      setCancelError(err);
      showToast(err, 'error');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading production batch details...</div>;
  }

  if (!batch) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p>Production batch not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate(listHref)}>
          Back to Production Batches
        </Button>
      </div>
    );
  }

  const variantMap: Record<ProductionStatus, 'success' | 'warning' | 'info' | 'danger'> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'warning',
    PENDING: 'info',
    PLANNED: 'info',
    CANCELLED: 'danger',
  };

  return (
    <div>
      <PageHeader
        title={`Batch #${batch.batchNumber}`}
        description={`Product: ${batch.productName}`}
        breadcrumbs={[
          { label: 'Production', href: listHref },
          { label: batch.batchNumber },
        ]}
        action={
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate(listHref)}
          >
            Back to List
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <p className="text-xs text-text-muted">Batch Status</p>
                <div className="mt-1">
                  <Badge variant={variantMap[batch.status]}>{batch.status.replace('_', ' ')}</Badge>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-text-muted">Central Store Inventory Transfer</p>
                <div className="mt-1">
                  <Badge variant={batch.goodsReceivedStatus === 'RECEIVED' ? 'success' : 'neutral'}>
                    {batch.goodsReceivedStatus}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-text-muted">Product Name</p>
                <p className="font-semibold text-text-primary text-sm">{batch.productName}</p>
              </div>

              <div>
                <p className="text-text-muted">Product Code</p>
                <p className="font-semibold text-text-primary text-sm">{batch.productId}</p>
              </div>

              <div>
                <p className="text-text-muted">Quantity Produced</p>
                <p className="font-bold text-primary text-base">
                  {batch.quantityProduced.toLocaleString()} {batch.unit}
                </p>
              </div>

              <div>
                <p className="text-text-muted">Operational Shift</p>
                <p className="font-semibold text-text-primary">{batch.shift} Shift</p>
              </div>

              <div>
                <p className="text-text-muted">Production Date</p>
                <p className="font-semibold text-text-primary">{batch.productionDate}</p>
              </div>

              <div>
                <p className="text-text-muted">Supervisor In-Charge</p>
                <p className="font-semibold text-text-primary">{batch.supervisor}</p>
              </div>
            </div>

            {batch.notes && (
              <div className="p-4 bg-slate-50 border border-border rounded-md">
                <p className="text-xs font-semibold text-text-primary mb-1">Quality Check & Log Notes:</p>
                <p className="text-xs text-text-secondary">{batch.notes}</p>
              </div>
            )}

            {/* Workflow status triggers */}
            <div className="pt-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-text-secondary">Update Batch Progression:</p>
              <div className="flex items-center gap-2">
                {batch.status === 'IN_PROGRESS' && (
                  <>
                    <Button
                      variant="success"
                      size="sm"
                      disabled={isUpdatingStatus}
                      isLoading={isUpdatingStatus}
                      onClick={() => handleStatusUpdate('COMPLETED')}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Mark Batch Completed
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={openCancelModal}
                    >
                      Cancel Batch
                    </Button>
                  </>
                )}
                {(batch.status === 'PENDING' || batch.status === 'PLANNED') && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isUpdatingStatus}
                      isLoading={isUpdatingStatus}
                      onClick={() => handleStatusUpdate('IN_PROGRESS')}
                    >
                      Start Production
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={openCancelModal}
                    >
                      Cancel Batch
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Goods Transfer Flow Explanation Card */}
        <Card title="Business Workflow" subtitle="Production -> Store Connection">
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-border rounded-md flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <p className="font-semibold text-text-primary">Goods Produced</p>
                <p className="text-text-secondary">Batch completion recorded by Production team.</p>
              </div>
            </div>

            <div className="flex justify-center text-text-muted">
              <ArrowRight className="w-4 h-4 rotate-90" />
            </div>

            <div className="p-3 bg-slate-50 border border-border rounded-md flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-secondary/15 text-secondary font-bold flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <p className="font-semibold text-text-primary">Store Goods Received</p>
                <p className="text-text-secondary">Ram&apos;s Store Manager module confirms stock receipt into Central Inventory.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Cancellation Reason Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => !isCancelling && setIsCancelModalOpen(false)}
        title="Cancel Production Batch"
        subtitle={`Batch #${batch.batchNumber} • ${batch.productName}`}
      >
        <form onSubmit={handleCancelSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-primary mb-1.5">
              Reason for Cancellation <span className="text-danger">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-24"
              placeholder="Please describe why this production batch is being cancelled (e.g., equipment breakdown, packaging shortage, contaminated water test)..."
              value={cancellationReason}
              onChange={(e) => {
                setCancellationReason(e.target.value);
                if (cancelError) setCancelError('');
              }}
              disabled={isCancelling}
              autoFocus
            />
            {cancelError && (
              <p className="mt-1.5 text-xs text-danger font-medium">{cancelError}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCancelModalOpen(false)}
              disabled={isCancelling}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isCancelling}
              disabled={isCancelling || !cancellationReason.trim()}
            >
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductionDetailPage;
