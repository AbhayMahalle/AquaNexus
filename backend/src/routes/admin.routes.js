const express = require('express');
const { getUsers, createUser, updateUser } = require('../controllers/user.controller');
const { getRoles, getPermissions } = require('../controllers/role.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(requireAuth);
router.use(requireRole(['ADMIN']));

// Users
router.get('/users', getUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);

// Roles & Permissions
router.get('/roles', getRoles);
router.get('/permissions', getPermissions);

module.exports = router;
