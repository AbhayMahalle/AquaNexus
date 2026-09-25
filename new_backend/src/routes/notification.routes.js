const express = require('express');
const { getMyNotifications, markAsRead } = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// All notification routes require authentication
router.use(requireAuth);

router.get('/', getMyNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;
