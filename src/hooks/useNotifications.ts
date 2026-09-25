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

// Role-specific demo notifications shown when backend returns nothing
const DEMO_NOTIFICATIONS: Record<string, AppNotification[]> = {
  admin: [
    { id: 'd1', title: 'New User Registered', message: 'A new distributor account "Ravi Agencies" has been created and is pending role assignment.', type: 'INFO', isRead: false, createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    { id: 'd2', title: 'Low Inventory Alert', message: 'Product "20L Jar – AquaNexus Premium" stock has dropped below the reorder level (48 units remaining).', type: 'WARNING', isRead: false, createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString() },
    { id: 'd3', title: 'Production Target Achieved', message: 'Bottling line completed the daily target of 2,400 units. Efficiency: 98.5%.', type: 'SUCCESS', isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'd4', title: 'Overtime Request Pending', message: '3 overtime requests from Production department are awaiting approval.', type: 'ALERT', isRead: true, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
    { id: 'd5', title: 'Monthly Report Ready', message: 'The August production and sales report has been compiled and is ready for review.', type: 'INFO', isRead: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  ],
  manager: [
    { id: 'm1', title: 'Leave Request – Suresh Patil', message: 'Suresh Patil (EMP004) has applied for 2 days of sick leave starting tomorrow. Action required.', type: 'ALERT', isRead: false, createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
    { id: 'm2', title: 'Attendance Discrepancy', message: '2 employees have unrecorded attendance for yesterday\'s morning shift. Please review.', type: 'WARNING', isRead: false, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'm3', title: 'Production Shift Completed', message: 'Evening shift (6 PM – 2 AM) completed with 1,150 units produced. Well done to the team.', type: 'SUCCESS', isRead: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'm4', title: 'New Overtime Logged', message: 'Ramesh Kumar logged 3 hours of overtime for last night. Please review and approve.', type: 'INFO', isRead: true, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'm5', title: 'Inventory Restock Alert', message: 'Store has requested restocking of raw PET granules. Supplier order needed within 2 days.', type: 'WARNING', isRead: true, createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString() },
  ],
  store_manager: [
    { id: 's1', title: 'Low Stock: 1L Water Bottle', message: '1L AquaNexus Mineral Water has only 120 units left. Reorder threshold is 500 units.', type: 'WARNING', isRead: false, createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString() },
    { id: 's2', title: 'Goods Received', message: 'Batch #GRN-2024-0089 of 5,000 PET bottles received from Supplier Co. Quality check pending.', type: 'SUCCESS', isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 's3', title: 'Dispatch Order Pending', message: 'Dispatch order #DSP-2024-0043 for distributor "Nisha Traders" is ready for processing.', type: 'ALERT', isRead: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 's4', title: 'Damaged Goods Report', message: '15 units from batch #LOT-034 reported as damaged during transit. Return process initiated.', type: 'WARNING', isRead: true, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 's5', title: 'Monthly Inventory Report', message: 'Your September inventory summary is ready. Net stock value: ₹8,42,000.', type: 'INFO', isRead: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  ],
  accountant: [
    { id: 'ac1', title: 'Invoice Overdue – Nisha Traders', message: 'Invoice #INV-2024-0078 (₹45,200) from Nisha Traders is 12 days overdue. Follow-up required.', type: 'ALERT', isRead: false, createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
    { id: 'ac2', title: 'Payroll Processing Due', message: 'September payroll for 12 employees is due for processing by the 28th. Please review.', type: 'WARNING', isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'ac3', title: 'Payment Received', message: 'Ravi Agencies has cleared outstanding invoice #INV-2024-0065 of ₹72,000. Bank reconciliation pending.', type: 'SUCCESS', isRead: false, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'ac4', title: 'New Expense Submitted', message: 'Maintenance expense of ₹8,500 has been submitted by the Operations team for approval.', type: 'INFO', isRead: true, createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() },
    { id: 'ac5', title: 'Outstanding Balance Updated', message: 'Total outstanding balance updated: ₹1,24,500 across 4 distributors as of today.', type: 'INFO', isRead: true, createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString() },
  ],
  distributor: [
    { id: 'di1', title: 'New Order Dispatched', message: 'Your order #ORD-2024-0112 has been dispatched from the plant. Expected delivery: tomorrow.', type: 'SUCCESS', isRead: false, createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { id: 'di2', title: 'Invoice Generated', message: 'Invoice #INV-2024-0091 for ₹33,600 has been generated for your last order. Due in 15 days.', type: 'INFO', isRead: false, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: 'di3', title: 'Low Stock Warning', message: '1L AquaNexus Water stock in your inventory is running low (85 units). Consider placing a reorder.', type: 'WARNING', isRead: false, createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: 'di4', title: 'Payment Confirmation', message: 'Your payment of ₹45,200 for invoice #INV-2024-0078 has been successfully received and recorded.', type: 'SUCCESS', isRead: true, createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString() },
    { id: 'di5', title: 'Return Request Processed', message: 'Your return request #RET-2024-0019 for 24 damaged units has been approved. Credit note issued.', type: 'INFO', isRead: true, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  ],
  employee: [
    { id: 'e1', title: 'Leave Request Approved', message: 'Your casual leave request for Sept 28–29 has been approved by your manager.', type: 'SUCCESS', isRead: false, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
    { id: 'e2', title: 'Overtime Request Received', message: 'Your overtime request for 3 hours on Sept 25 has been submitted and is pending manager approval.', type: 'INFO', isRead: false, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    { id: 'e3', title: 'Shift Schedule Updated', message: 'Your shift schedule for October has been published. Morning shift (6 AM – 2 PM) starting Oct 1.', type: 'INFO', isRead: false, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
    { id: 'e4', title: 'Attendance Marked – Present', message: 'Your attendance for today (Sept 25) has been recorded as PRESENT. Check-in: 6:02 AM.', type: 'SUCCESS', isRead: true, createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
    { id: 'e5', title: 'Salary Credited', message: 'Your August salary of ₹28,500 has been credited to your registered bank account.', type: 'SUCCESS', isRead: true, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  ],
};

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
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setNotifications(res.data);
      } else {
        // Fall back to role-aware demo data
        const demo = DEMO_NOTIFICATIONS[user.role] || DEMO_NOTIFICATIONS['employee'];
        setNotifications(demo);
      }
    } catch {
      const demo = DEMO_NOTIFICATIONS[user.role] || DEMO_NOTIFICATIONS['employee'];
      setNotifications(demo);
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

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [load]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const notificationsWithTime = notifications.map(n => ({ ...n, timeAgo: timeAgo(n.createdAt) }));

  return { notifications: notificationsWithTime, unreadCount, isLoading, markAsRead, markAllAsRead, reload: load };
}
