const express = require('express');
const { getMyNotifications, markAsRead, markAsUnread, markAllRead } = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// All notification routes require authentication
router.use(requireAuth);

router.get('/', getMyNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markAsRead);
router.patch('/:id/unread', markAsUnread);

module.exports = router;
