const express = require('express');
const { 
  assignManagerArea, 
  getManagerAssignments,
  updateManagerAssignment,
  deleteManagerAssignment
} = require('../controllers/managerAssignment.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const { 
  validateAssignArea, 
  validateUpdateArea, 
  validateIdParam,
  validateUserIdParam 
} = require('../validators/managerAssignment.validator');
const { validate } = require('../utils/validate');

const router = express.Router();

router.use(requireAuth);
// Allow only ADMIN to create assignments
router.post('/', requireRole(['ADMIN']), validateAssignArea, validate, assignManagerArea);
router.patch('/:id', requireRole(['ADMIN']), validateUpdateArea, validate, updateManagerAssignment);
router.delete('/:id', requireRole(['ADMIN']), validateIdParam, validate, deleteManagerAssignment);

// Allow ADMIN, or the specific user themselves (handled partially by generic access, but we'll restrict to authenticated for now)
router.get('/:userId', validateUserIdParam, validate, getManagerAssignments);

module.exports = router;
