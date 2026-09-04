const express = require("express");
const {
  getUsers,
  createUser,
  updateUser,
} = require("../controllers/user.controller");
const { getRoles, getPermissions } = require("../controllers/role.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const router = express.Router();

const adminOnly = [requireAuth, requireRole(["ADMIN"])];

// Users
router.get("/users", ...adminOnly, getUsers);
router.post("/users", ...adminOnly, createUser);
router.patch("/users/:id", ...adminOnly, updateUser);

// Roles & Permissions
router.get("/roles", ...adminOnly, getRoles);
router.get("/permissions", ...adminOnly, getPermissions);

module.exports = router;
