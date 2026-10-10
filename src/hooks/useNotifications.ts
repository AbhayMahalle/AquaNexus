import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}



function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await apiClient.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    // Try real backend (won't fail if it's a demo ID)
    try {
      await apiClient.markNotificationAsRead(id);
    } catch { /* demo ids — no-op */ }
  }, []);

  const markAsUnread = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: false } : n)
    );
    try {
      await apiClient.markNotificationAsUnread(id);
    } catch { /* demo ids — no-op */ }
  }, []);

  const toggleRead = useCallback(async (id: string) => {
    const item = notifications.find(n => n.id === id);
    if (!item) return;
    if (item.isRead) {
      await markAsUnread(id);
    } else {
      await markAsRead(id);
    }
  }, [notifications, markAsRead, markAsUnread]);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await apiClient.markAllNotificationsAsRead();
    } catch { /* demo ids — no-op */ }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const notificationsWithTime = notifications.map(n => ({ ...n, timeAgo: timeAgo(n.createdAt) }));

  return {
    notifications: notificationsWithTime,
    unreadCount,
    isLoading,
    markAsRead,
    markAsUnread,
    toggleRead,
    markAllAsRead,
    reload: load
  };
}
