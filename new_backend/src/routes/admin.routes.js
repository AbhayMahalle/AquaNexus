const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
} = require("../controllers/user.controller");
const { getRoles, getPermissions } = require("../controllers/role.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const { 
  validateCreateUser, 
  validateUpdateUser, 
  validateUserIdParam 
} = require("../validators/user.validator");
const { validate } = require("../utils/validate");

const router = express.Router();

const adminOnly = [requireAuth, requireRole(["ADMIN"])];

// Users
router.get("/users", ...adminOnly, getUsers);
router.get("/users/:id", ...adminOnly, validateUserIdParam, validate, getUser);
router.post("/users", ...adminOnly, validateCreateUser, validate, createUser);
router.patch("/users/:id", ...adminOnly, validateUpdateUser, validate, updateUser);

// Roles & Permissions
router.get("/roles", ...adminOnly, getRoles);
router.get("/permissions", ...adminOnly, getPermissions);

module.exports = router;
