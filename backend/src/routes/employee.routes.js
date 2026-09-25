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

const canViewEmployees = (req, res, next) => {
  if (req.user?.role?.name === 'ACCOUNTANT') {
    return next();
  }
  return requirePermission('employee.view')(req, res, next);
};

router.get('/departments', requireAuth, canViewEmployees, getDepartments);
router.get('/', requireAuth, canViewEmployees, getEmployees);
router.get('/:id', requireAuth, canViewEmployees, getEmployeeById);
router.post('/', requireAuth, requirePermission('employee.create'), createEmployee);
router.patch('/:id', requireAuth, requirePermission('employee.update'), updateEmployee);
router.put('/:id', requireAuth, requirePermission('employee.update'), updateEmployee);

module.exports = router;
