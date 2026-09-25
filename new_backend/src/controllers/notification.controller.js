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
    const notification = await notificationService.markNotificationAsRead(notificationId);
    if (!notification) {
      return sendError(res, 'Notification not found or error updating', 404);
    }
    return sendSuccess(res, notification, 'Notification marked as read');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead
};
