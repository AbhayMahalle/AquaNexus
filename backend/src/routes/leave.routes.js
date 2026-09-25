const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getLeaves,
  createLeave,
  updateLeaveStatus
} = require('../controllers/leave.controller');

router.get('/', requireAuth, requirePermission('attendance.view'), getLeaves);
router.post('/', requireAuth, requirePermission('attendance.create'), createLeave);
router.patch('/:id', requireAuth, requirePermission('attendance.update'), updateLeaveStatus);

module.exports = router;
