const express = require('express');
const { assignManagerArea, getManagerAssignments } = require('../controllers/managerAssignment.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(requireAuth);
// Allow only ADMIN to create assignments
router.post('/', requireRole(['ADMIN']), assignManagerArea);

// Allow ADMIN, or the specific user themselves (handled partially by generic access, but we'll restrict to authenticated for now)
router.get('/:userId', getManagerAssignments);

module.exports = router;
