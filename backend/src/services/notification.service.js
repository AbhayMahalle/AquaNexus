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
const createNotification = async ({ userId, title, message, type = 'INFO' }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
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
        userId,
        isRead: false
      },
      orderBy: { createdAt: 'desc' }
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
 * @returns {Promise<Object>} The updated notification
 */
const markNotificationAsRead = async (notificationId) => {
  try {
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

module.exports = {
  createNotification,
  getUserNotifications,
  markNotificationAsRead
};
