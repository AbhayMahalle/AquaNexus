import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Bell, Check, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

const TYPE_CONFIG: Record<AppNotification['type'], { icon: React.ReactNode; dot: string; bg: string; badge: string }> = {
  SUCCESS: { icon: <Check className="w-4 h-4 text-emerald-600" />, dot: 'bg-emerald-500', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
  WARNING: { icon: <AlertTriangle className="w-4 h-4 text-amber-600" />, dot: 'bg-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  ALERT:   { icon: <AlertTriangle className="w-4 h-4 text-red-600" />, dot: 'bg-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
  INFO:    { icon: <Info className="w-4 h-4 text-blue-600" />, dot: 'bg-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' },
};

export function EmployeeNotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description="Your system alerts, approvals, and updates"
          breadcrumbs={[
            { label: 'Employee Portal', href: '/employee/dashboard' },
            { label: 'Notifications' }
          ]}
          action={
            unreadCount > 0 ? (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <CheckCheck className="w-4 h-4" />
                Mark all as read
              </button>
            ) : undefined
          }
        />

        <div className="max-w-3xl">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-white border border-gray-200 rounded-xl text-center">
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Total</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-center">
              <p className="text-2xl font-bold text-orange-600">{unreadCount}</p>
              <p className="text-xs text-orange-600 mt-0.5">Unread</p>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
              <p className="text-xs text-green-600 mt-0.5">Read</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-4 p-5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 bg-gray-100 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                        <div className="h-3 bg-gray-100 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Bell className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">All caught up!</p>
                  <p className="text-xs mt-1">You have no notifications at this time.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(n => {
                    const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
                    return (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={`flex gap-4 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-orange-50/40' : ''}`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${cfg.bg}`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                              {n.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${cfg.badge}`}>
                                {n.type}
                              </span>
                              {!n.isRead && <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{n.message}</p>
                          <span className="text-[11px] text-gray-400 mt-1.5 block">{(n as any).timeAgo}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
