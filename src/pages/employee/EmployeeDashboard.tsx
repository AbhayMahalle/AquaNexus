import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CalendarCheck, CalendarOff, Clock, User as UserIcon, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';

export function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  async function loadData() {
    setLoading(true);
    try {
      const [profRes, attRes, levRes] = await Promise.all([
        apiClient.getMyProfile(),
        apiClient.getAttendance(),
        apiClient.getLeaves()
      ]);

      if (profRes.success) setProfile(profRes.data);
      if (attRes.success) setAttendance(attRes.data);
      if (levRes.success) setLeaves(levRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);


  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
            <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      );
    }

    const presents = attendance.filter(a => a.status === 'PRESENT').length;
    const approvedLeaves = leaves.filter(l => l.status === 'APPROVED').length;
    const pendingLeaves = leaves.filter(l => l.status === 'PENDING').length;

    return (
      <div className="space-y-6">
        <PageHeader
          title={`Welcome, ${profile?.firstName || 'Employee'}!`}
          description={`${profile?.designation || 'Staff'} • ${profile?.department?.name || 'Plant Operations'}`}
          breadcrumbs={[{ label: 'My Workspace' }]}
          primaryAction={{
            label: 'Request Leave',
            href: '/employee/leave',
            variant: 'primary',
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Days Present</p>
                <div className="text-2xl font-bold text-black mt-1">{presents}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-green-50 text-green-600 border border-green-200">
                <CalendarCheck className="h-5 w-5" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Approved Leaves</p>
                <div className="text-2xl font-bold text-black mt-1">{approvedLeaves}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <CalendarOff className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Requests</p>
                <div className="text-2xl font-bold text-black mt-1">{pendingLeaves}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              {attendance.length === 0 ? (
                <p className="text-sm text-gray-500">No recent attendance records.</p>
              ) : (
                <div className="space-y-4">
                  {attendance.slice(0, 5).map((att) => (
                    <div key={att.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                      <div className="text-sm font-medium">
                        {new Date(att.attendanceDate).toLocaleDateString()}
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-sm flex gap-2 items-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${att.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {att.status}
                          </span>
                          {att.checkIn && <span className="text-gray-500 text-xs">In: {new Date(att.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                          {att.checkOut && <span className="text-gray-500 text-xs ml-1">Out: {new Date(att.checkOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
                        </div>
                        {att.remarks && <span className="text-xs text-gray-500 mt-1 italic">Note: {att.remarks}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {leaves.length === 0 ? (
                <p className="text-sm text-gray-500">No recent leave requests.</p>
              ) : (
                <div className="space-y-4">
                  {leaves.slice(0, 5).map((leave) => (
                    <div key={leave.id} className="flex flex-col border-b pb-2 last:border-0 last:pb-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{leave.leaveType}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          leave.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          leave.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {leave.status}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <AuthGuard allowedRoles={['employee', 'admin']}>
      <DashboardLayout>
        {renderContent()}
      </DashboardLayout>
    </AuthGuard>
  );
}
