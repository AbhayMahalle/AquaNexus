const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getOvertime,
  createOvertime,
  updateOvertimeStatus
} = require('../controllers/overtime.controller');

router.get('/', requireAuth, requirePermission('attendance.view'), getOvertime);
router.post('/', requireAuth, requirePermission('attendance.create'), createOvertime);
router.patch('/:id', requireAuth, requirePermission('attendance.update'), updateOvertimeStatus);

module.exports = router;
