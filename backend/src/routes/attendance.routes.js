const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getAttendance,
  recordAttendance
} = require('../controllers/attendance.controller');

router.get('/', requireAuth, requirePermission('attendance.view'), getAttendance);
router.post('/', requireAuth, requirePermission('attendance.create'), recordAttendance);

module.exports = router;
