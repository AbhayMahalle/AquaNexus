import React from 'react';
import { Bell, Check, AlertTriangle, Info, CheckCheck } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

const TYPE_CONFIG: Record<AppNotification['type'], { icon: React.ReactNode; dot: string; bg: string; label: string }> = {
  SUCCESS: { icon: <Check className="w-3.5 h-3.5 text-emerald-600" />, dot: 'bg-emerald-500', bg: 'bg-emerald-50 border-emerald-100', label: 'text-emerald-700' },
  WARNING: { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />, dot: 'bg-amber-500', bg: 'bg-amber-50 border-amber-100', label: 'text-amber-700' },
  ALERT:   { icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />, dot: 'bg-red-500', bg: 'bg-red-50 border-red-100', label: 'text-red-700' },
  INFO:    { icon: <Info className="w-3.5 h-3.5 text-blue-600" />, dot: 'bg-blue-500', bg: 'bg-blue-50 border-blue-100', label: 'text-blue-700' },
};

interface NotificationsPanelProps {
  maxItems?: number;
}

export function NotificationsPanel({ maxItems = 5 }: NotificationsPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } = useNotifications();
  const visible = notifications.slice(0, maxItems);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base font-semibold">Notifications</CardTitle>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[11px] font-bold rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Bell className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">All caught up! No notifications.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {visible.map(n => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.INFO;
              return (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`flex gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-orange-50/30' : ''}`}
                >
                  <div className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center ${cfg.bg}`}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className={`text-xs font-semibold ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] text-gray-400">{(n as any).timeAgo}</span>
                        {!n.isRead && <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{n.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {notifications.length > maxItems && (
          <div className="border-t border-gray-100 px-4 py-2.5 text-center">
            <span className="text-xs text-gray-400">{notifications.length - maxItems} more notifications in the bell above</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
