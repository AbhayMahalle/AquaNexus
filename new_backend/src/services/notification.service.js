const prisma = require('../config/db');

/**
 * Creates a notification for a user.
 * 
 * @param {Object} params
 * @param {string} params.userId - UUID of the user to notify
 * @param {string} params.title - Title of the notification
 * @param {string} params.message - Body of the notification
 * @param {string} params.type - NotificationType enum ('INFO', 'WARNING', 'ALERT', 'SUCCESS')
 * @returns {Promise<Object>} The created notification
 */
const createNotification = async ({ userId, title, message, type = 'INFO', organizationId }) => {
  try {
    let orgId = organizationId;
    if (!orgId && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
      orgId = user?.organizationId;
    }
    const notification = await prisma.notification.create({
      data: {
        userId,
        organizationId: orgId,
        title,
        message,
        type
      }
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

/**
 * Retrieves unread notifications for a user.
 * 
 * @param {string} userId - UUID of the user
 * @returns {Promise<Array>} List of notifications
 */
const getUserNotifications = async (userId) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { 
        userId
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return notifications;
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
};

/**
 * Marks a notification as read.
 * 
 * @param {string} notificationId - UUID of the notification
 * @param {string} [userId] - Optional UUID of user to ensure ownership
 * @returns {Promise<Object>} The updated notification
 */
const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const where = { id: notificationId };
    if (userId) where.userId = userId;

    const notif = await prisma.notification.findFirst({ where });
    if (!notif) return null;

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    });
    return notification;
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    return null;
  }
};

/**
 * Marks a notification as unread.
 * 
 * @param {string} notificationId - UUID of the notification
 * @param {string} [userId] - Optional UUID of user to ensure ownership
 * @returns {Promise<Object>} The updated notification
 */
const markNotificationAsUnread = async (notificationId, userId) => {
  try {
    const where = { id: notificationId };
    if (userId) where.userId = userId;

    const notif = await prisma.notification.findFirst({ where });
    if (!notif) return null;

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        isRead: false,
        readAt: null
      }
    });
    return notification;
  } catch (error) {
    console.error('Failed to mark notification as unread:', error);
    return null;
  }
};

/**
 * Marks all notifications for a user as read.
 * 
 * @param {string} userId - UUID of user
 * @returns {Promise<boolean>}
 */
const markAllNotificationsAsRead = async (userId) => {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead
};
