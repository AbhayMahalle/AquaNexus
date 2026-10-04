const express = require("express");
const {
  getOrganizations,
  getOrganizationById,
  provisionOrganization,
  addOrganizationAdmin,
  updateOrganizationStatus,
} = require("../controllers/organization.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireSuperAdmin } = require("../middleware/tenant.middleware");

const router = express.Router();

const superAdminOnly = [requireAuth, requireSuperAdmin];

router.get("/organizations", ...superAdminOnly, getOrganizations);
router.post("/organizations", ...superAdminOnly, provisionOrganization);
router.get("/organizations/:id", ...superAdminOnly, getOrganizationById);
router.post("/organizations/:id/admins", ...superAdminOnly, addOrganizationAdmin);
router.patch("/organizations/:id/status", ...superAdminOnly, updateOrganizationStatus);

module.exports = router;
