import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { leaveService } from '../../services/leaveService';
import type { Leave, LeaveStatus } from '../../types';

export const LeaveDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [leave, setLeave] = useState<Leave | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      leaveService.getLeaveById(id).then((res) => {
        if (res.success) setLeave(res.data);
        setIsLoading(false);
      });
    }
  }, [id]);

  const handleAction = async (status: 'APPROVED' | 'REJECTED') => {
    if (!id) return;
    const res = await leaveService.updateLeaveStatus(id, status);
    if (res.success) setLeave(res.data);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading leave record...</div>;
  }

  if (!leave) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p>Leave request not found.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/leave')}>
          Back to Leave List
        </Button>
      </div>
    );
  }

  const variantMap: Record<LeaveStatus, 'warning' | 'success' | 'danger'> = {
    PENDING: 'warning',
    APPROVED: 'success',
    REJECTED: 'danger',
  };

  return (
    <div>
      <PageHeader
        title={`Leave Application #${leave.id}`}
        description={`Submitted by ${leave.employeeName} (${leave.employeeId})`}
        breadcrumbs={[
          { label: 'Leave Requests', href: '/leave' },
          { label: `Leave #${leave.id}` },
        ]}
        action={
          <Button
            variant="secondary"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={() => navigate('/leave')}
          >
            Back to List
          </Button>
        }
      />

      <Card className="max-w-2xl">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <p className="text-xs text-text-muted">Status</p>
              <div className="mt-1">
                <Badge variant={variantMap[leave.status]}>{leave.status}</Badge>
              </div>
            </div>
            {leave.approvedBy && (
              <div className="text-right">
                <p className="text-xs text-text-muted">Reviewed By</p>
                <p className="text-xs font-semibold text-text-primary mt-1">{leave.approvedBy}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-text-muted">Employee Name</p>
              <p className="font-semibold text-text-primary text-sm">{leave.employeeName}</p>
            </div>

            <div>
              <p className="text-text-muted">Department</p>
              <p className="font-semibold text-text-primary text-sm">{leave.department}</p>
            </div>

            <div>
              <p className="text-text-muted">Leave Type</p>
              <p className="font-semibold text-text-primary">{leave.leaveType}</p>
            </div>

            <div>
              <p className="text-text-muted">Total Days</p>
              <p className="font-semibold text-text-primary">{leave.totalDays} Day(s)</p>
            </div>

            <div>
              <p className="text-text-muted">Start Date</p>
              <p className="font-semibold text-text-primary">{leave.startDate}</p>
            </div>

            <div>
              <p className="text-text-muted">End Date</p>
              <p className="font-semibold text-text-primary">{leave.endDate}</p>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-border rounded-md">
            <p className="text-xs font-semibold text-text-primary mb-1">Reason for Request:</p>
            <p className="text-xs text-text-secondary">{leave.reason}</p>
          </div>

          {leave.status === 'PENDING' && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                variant="danger"
                onClick={() => handleAction('REJECTED')}
                icon={<XCircle className="w-4 h-4" />}
              >
                Reject Request
              </Button>
              <Button
                variant="success"
                onClick={() => handleAction('APPROVED')}
                icon={<CheckCircle className="w-4 h-4" />}
              >
                Approve Request
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
