const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { requireTenantContext } = require('../middleware/tenant.middleware');
const { requirePermission } = require('../middleware/rbac.middleware');
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  getDepartments,
  deleteEmployee
} = require('../controllers/employee.controller');

router.use(requireAuth, requireTenantContext);

router.get('/departments', requirePermission('employee.view'), getDepartments);
router.get('/', requirePermission('employee.view'), getEmployees);
router.get('/:id', requirePermission('employee.view'), getEmployeeById);
router.post('/', requirePermission('employee.create'), createEmployee);
router.put('/:id', requirePermission('employee.update'), updateEmployee);
router.patch('/:id', requirePermission('employee.update'), updateEmployee);
router.delete('/:id', requirePermission('employee.update'), deleteEmployee);

module.exports = router;
