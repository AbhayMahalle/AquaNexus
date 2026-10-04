const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireTenantContext } = require('../middleware/tenant.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getLeaves,
  createLeave,
  updateLeaveStatus
} = require('../controllers/leave.controller');

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requirePermission('attendance.view'), getLeaves);
router.post('/', requirePermission('attendance.create'), createLeave);
router.patch('/:id', requirePermission('attendance.update'), updateLeaveStatus);
router.patch('/:id/status', requirePermission('attendance.update'), updateLeaveStatus);

module.exports = router;
