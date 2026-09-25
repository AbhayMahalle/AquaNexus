'use client';

import React, { useState } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Info, X } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

const TYPE_STYLES: Record<AppNotification['type'], { icon: React.ReactNode; dot: string; bg: string }> = {
  SUCCESS: { icon: <Check className="w-3.5 h-3.5 text-emerald-600" />, dot: 'bg-emerald-500', bg: 'bg-emerald-50' },
  WARNING: { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />, dot: 'bg-amber-500', bg: 'bg-amber-50' },
  ALERT:   { icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />, dot: 'bg-red-500', bg: 'bg-red-50' },
  INFO:    { icon: <Info className="w-3.5 h-3.5 text-blue-600" />, dot: 'bg-blue-500', bg: 'bg-blue-50' },
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-12 z-50 w-96 max-h-[520px] flex flex-col rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-gray-200 text-gray-500">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-50">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.map(n => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.INFO;
                  return (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${!n.isRead ? 'bg-orange-50/40' : ''}`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${style.bg}`}>
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-xs font-semibold leading-snug ${!n.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                            {n.title}
                          </p>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {!n.isRead && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">{(n as any).timeAgo}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50">
              <p className="text-[11px] text-gray-400 text-center">Click a notification to mark it as read</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
