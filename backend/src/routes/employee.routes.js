const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  getDepartments
} = require('../controllers/employee.controller');

router.get('/departments', requireAuth, requirePermission('employee.view'), getDepartments);
router.get('/', requireAuth, requirePermission('employee.view'), getEmployees);
router.get('/:id', requireAuth, requirePermission('employee.view'), getEmployeeById);
router.post('/', requireAuth, requirePermission('employee.create'), createEmployee);
router.patch('/:id', requireAuth, requirePermission('employee.update'), updateEmployee);

module.exports = router;
