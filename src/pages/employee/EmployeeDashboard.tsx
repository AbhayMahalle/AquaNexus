import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CalendarCheck, CalendarOff, Clock, User as UserIcon, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { NotificationsPanel } from '@/components/layout/NotificationsPanel';

export function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
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
          description={`${profile?.designation || 'Staff'} • ${profile?.department?.name || 'Department'}`}
          breadcrumbs={[{ label: 'Employee Portal' }]}
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Days Present (All Time)</CardTitle>
              <CalendarCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{presents}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Approved Leaves</CardTitle>
              <CalendarOff className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedLeaves}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Pending Leaves</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingLeaves}</div>
            </CardContent>
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
                      <div className="text-sm flex gap-2 items-center">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${att.status === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {att.status}
                        </span>
                        {att.checkIn && <span className="text-gray-500">In: {new Date(att.checkIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>}
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

        <NotificationsPanel maxItems={4} />
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
