const express = require('express');
const { getAuditLogs } = require('../controllers/audit.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(['ADMIN']));

router.get('/', getAuditLogs);

module.exports = router;
