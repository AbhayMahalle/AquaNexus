import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, CheckCircle, XCircle, Eye } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { leaveService } from '../../services/leaveService';
import type { Leave, LeaveStatus } from '../../types';

export const LeaveListPage: React.FC = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [reviewTarget, setReviewTarget] = useState<Leave | null>(null);

  const fetchLeaves = async () => {
    setIsLoading(true);
    const res = await leaveService.getLeaveRequests({ status, search });
    if (res.success) setLeaves(res.data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, [status, search]);

  const handleReview = async (newStatus: 'APPROVED' | 'REJECTED') => {
    if (!reviewTarget) return;
    await leaveService.updateLeaveStatus(reviewTarget.id, newStatus);
    setReviewTarget(null);
    fetchLeaves();
  };

  const columns = [
    {
      header: 'Employee',
      cell: (l: Leave) => (
        <div>
          <p className="font-semibold text-text-primary">{l.employeeName}</p>
          <p className="text-[11px] text-text-secondary">{l.employeeId} • {l.department}</p>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      cell: (l: Leave) => <Badge variant="secondary">{l.leaveType}</Badge>,
    },
    {
      header: 'Duration',
      cell: (l: Leave) => (
        <div>
          <p className="text-xs font-semibold text-text-primary">
            {l.startDate} to {l.endDate}
          </p>
          <p className="text-[11px] text-text-secondary">{l.totalDays} Day(s)</p>
        </div>
      ),
    },
    {
      header: 'Reason',
      cell: (l: Leave) => (
        <span className="text-xs text-text-secondary line-clamp-1 max-w-xs">{l.reason}</span>
      ),
    },
    {
      header: 'Status',
      cell: (l: Leave) => {
        const variantMap: Record<LeaveStatus, 'warning' | 'success' | 'danger'> = {
          PENDING: 'warning',
          APPROVED: 'success',
          REJECTED: 'danger',
        };
        return <Badge variant={variantMap[l.status]}>{l.status}</Badge>;
      },
    },
    {
      header: 'Actions',
      cell: (l: Leave) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/leave/${l.id}`)}
            title="View Details"
            icon={<Eye className="w-3.5 h-3.5 text-secondary" />}
          />
          {l.status === 'PENDING' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setReviewTarget(l)}
            >
              Review
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Leave Management"
        description="Track and process employee leave requests and approvals."
        action={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/leave/create')}
          >
            Apply New Leave
          </Button>
        }
      />

      <Card className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-72">
            <Input
              placeholder="Search employee, reason..."
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
                { value: 'PENDING', label: 'Pending Review' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Table
        columns={columns}
        data={leaves}
        keyExtractor={(item) => item.id}
        isLoading={isLoading}
        emptyText="No leave records found."
      />

      {/* Review Modal */}
      <Modal
        isOpen={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        title="Review Leave Application"
        subtitle={`Application from ${reviewTarget?.employeeName}`}
        footer={
          <>
            <Button variant="danger" onClick={() => handleReview('REJECTED')} icon={<XCircle className="w-4 h-4" />}>
              Reject Leave
            </Button>
            <Button variant="success" onClick={() => handleReview('APPROVED')} icon={<CheckCircle className="w-4 h-4" />}>
              Approve Leave
            </Button>
          </>
        }
      >
        {reviewTarget && (
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 border border-border rounded-md">
              <p className="text-text-muted">Reason given:</p>
              <p className="font-semibold text-text-primary text-sm mt-1">{reviewTarget.reason}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-text-muted">Start Date</p>
                <p className="font-semibold text-text-primary">{reviewTarget.startDate}</p>
              </div>
              <div>
                <p className="text-text-muted">End Date</p>
                <p className="font-semibold text-text-primary">{reviewTarget.endDate}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
