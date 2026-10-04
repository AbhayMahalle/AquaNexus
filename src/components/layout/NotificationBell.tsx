'use client';

import React, { useState, useMemo } from 'react';
import { Bell, Check, CheckCheck, AlertTriangle, Info, X, MailOpen, Mail } from 'lucide-react';
import { useNotifications, AppNotification } from '@/hooks/useNotifications';

const TYPE_STYLES: Record<AppNotification['type'], { icon: React.ReactNode; dot: string; bg: string }> = {
  SUCCESS: { icon: <Check className="w-3.5 h-3.5 text-emerald-600" />, dot: 'bg-emerald-500', bg: 'bg-emerald-50 text-emerald-600' },
  WARNING: { icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />, dot: 'bg-amber-500', bg: 'bg-amber-50 text-amber-600' },
  ALERT:   { icon: <AlertTriangle className="w-3.5 h-3.5 text-red-600" />, dot: 'bg-red-500', bg: 'bg-red-50 text-red-600' },
  INFO:    { icon: <Info className="w-3.5 h-3.5 text-blue-600" />, dot: 'bg-blue-500', bg: 'bg-blue-50 text-blue-600' },
};

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAsUnread, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const readCount = useMemo(() => notifications.filter(n => n.isRead).length, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    if (filter === 'read') return notifications.filter(n => n.isRead);
    return notifications;
  }, [notifications, filter]);

  return (
    <div className="relative">
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 hover:text-black cursor-pointer"
        aria-label="Notifications"
        title="View Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 top-12 z-50 w-96 max-w-[calc(100vw-2rem)] max-h-[560px] flex flex-col rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-orange-500" />
                <span className="font-semibold text-sm text-gray-900">Notifications</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold px-2 py-0.5 rounded hover:bg-blue-50 transition-colors"
                    title="Mark all notifications as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Tabs (All / Unread / Read) */}
            <div className="flex items-center gap-1 p-2 bg-gray-50/50 border-b border-gray-100 text-xs font-medium">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                  filter === 'all'
                    ? 'bg-white shadow-xs font-semibold text-orange-600 border border-gray-200/80'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <span>All</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'all' ? 'bg-orange-50 text-orange-600 font-bold' : 'bg-gray-200 text-gray-600'}`}>
                  {notifications.length}
                </span>
              </button>

              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                  filter === 'unread'
                    ? 'bg-white shadow-xs font-semibold text-orange-600 border border-gray-200/80'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <span>Unread</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'unread' ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-gray-200 text-gray-600'}`}>
                  {unreadCount}
                </span>
              </button>

              <button
                onClick={() => setFilter('read')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all ${
                  filter === 'read'
                    ? 'bg-white shadow-xs font-semibold text-orange-600 border border-gray-200/80'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                }`}
              >
                <span>Read</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filter === 'read' ? 'bg-orange-50 text-orange-600 font-bold' : 'bg-gray-200 text-gray-600'}`}>
                  {readCount}
                </span>
              </button>
            </div>

            {/* Notification list */}
            <div className="overflow-y-auto flex-1 divide-y divide-gray-100 max-h-[380px]">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-400">
                  <Bell className="w-8 h-8 mb-2 opacity-30 text-gray-400" />
                  <p className="text-sm font-medium text-gray-600">
                    {filter === 'unread'
                      ? 'No unread notifications'
                      : filter === 'read'
                      ? 'No read notifications'
                      : 'No notifications'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {filter === 'unread'
                      ? "You're completely caught up!"
                      : 'New activity and alerts will appear here.'}
                  </p>
                </div>
              ) : (
                filteredNotifications.map(n => {
                  const style = TYPE_STYLES[n.type] || TYPE_STYLES.INFO;
                  return (
                    <div
                      key={n.id}
                      className={`group flex items-start gap-3 px-4 py-3 transition-colors ${
                        !n.isRead ? 'bg-orange-50/40 hover:bg-orange-50/70' : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${style.bg}`}>
                        {style.icon}
                      </div>

                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => (n.isRead ? markAsUnread(n.id) : markAsRead(n.id))}>
                        <div className="flex items-start justify-between gap-1.5">
                          <p className={`text-xs leading-snug ${!n.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-orange-500 mt-1" title="Unread" />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-gray-400 mt-1.5 block">{(n as any).timeAgo}</span>
                      </div>

                      {/* Quick Read/Unread Action Button */}
                      <div className="flex-shrink-0 flex items-center pt-0.5">
                        {n.isRead ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsUnread(n.id);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors cursor-pointer"
                            title="Mark as unread"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/80 flex items-center justify-between text-[11px] text-gray-500">
              <span>Filter: <strong className="capitalize">{filter}</strong></span>
              <span>Click item or icon to toggle read</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
