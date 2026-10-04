const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireTenantContext } = require('../middleware/tenant.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getOvertime,
  createOvertime,
  updateOvertimeStatus
} = require('../controllers/overtime.controller');

router.use(requireAuth);
router.use(requireTenantContext);

router.get('/', requirePermission('attendance.view'), getOvertime);
router.post('/', requirePermission('attendance.create'), createOvertime);
router.patch('/:id', requirePermission('attendance.update'), updateOvertimeStatus);
router.patch('/:id/status', requirePermission('attendance.update'), updateOvertimeStatus);

module.exports = router;
