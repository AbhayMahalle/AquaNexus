const notificationService = require('../services/notification.service');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getUserNotifications(req.user.id);
    return sendSuccess(res, notifications, 'Notifications retrieved successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await notificationService.markNotificationAsRead(notificationId, req.user?.id);
    if (!notification) {
      return sendError(res, 'Notification not found or error updating', 404);
    }
    return sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const markAsUnread = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await notificationService.markNotificationAsUnread(notificationId, req.user?.id);
    if (!notification) {
      return sendError(res, 'Notification not found or error updating', 404);
    }
    return sendSuccess(res, notification, 'Notification marked as unread');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

const markAllRead = async (req, res) => {
  try {
    await notificationService.markAllNotificationsAsRead(req.user?.id);
    return sendSuccess(res, null, 'All notifications marked as read');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAsUnread,
  markAllRead
};
