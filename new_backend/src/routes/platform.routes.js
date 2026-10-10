const express = require('express');
const {
  getPlatformStats,
  getSuperAdminProfile,
  updateSuperAdminProfile,
  changeSuperAdminPassword,
  getPlatformSettings,
  updatePlatformSetting,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  getCompanySubscriptions,
  assignSubscription,
  updateSubscriptionStatus,
  getSubscriptionPayments,
  recordPayment,
  getCurrentCompanySubscription,
} = require('../controllers/platform.controller');
const {
  getOrganizations,
  getOrganizationById,
  provisionOrganization,
  addOrganizationAdmin,
  updateOrganizationStatus: updateOrgStatus,
  getCompanyProfile,
  updateCompanyProfile,
  deleteOrganization,
} = require('../controllers/organization.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireSuperAdmin } = require('../middleware/tenant.middleware');

const router = express.Router();
const superAdminOnly = [requireAuth, requireSuperAdmin];

// ============================================================
// PLATFORM SUPER ADMIN (Aazira Solution Platform Owner)
// ============================================================

// Platform overview statistics
router.get('/platform/stats', ...superAdminOnly, getPlatformStats);

// Super Admin Profile & Security
router.get('/platform/profile', ...superAdminOnly, getSuperAdminProfile);
router.put('/platform/profile', ...superAdminOnly, updateSuperAdminProfile);
router.put('/platform/change-password', ...superAdminOnly, changeSuperAdminPassword);

// Platform-level Settings
router.get('/platform/settings', ...superAdminOnly, getPlatformSettings);
router.put('/platform/settings', ...superAdminOnly, updatePlatformSetting);

// Subscription Plans (Basic, Pro, Pro Max, Custom)
router.get('/platform/plans', ...superAdminOnly, getSubscriptionPlans);
router.post('/platform/plans', ...superAdminOnly, createSubscriptionPlan);
router.put('/platform/plans/:id', ...superAdminOnly, updateSubscriptionPlan);

// Company Subscriptions Management
router.get('/platform/subscriptions', ...superAdminOnly, getCompanySubscriptions);
router.post('/platform/subscriptions/assign', ...superAdminOnly, assignSubscription);
router.post('/platform/subscriptions', ...superAdminOnly, assignSubscription);
router.post('/platform/organizations/:id/subscription', ...superAdminOnly, assignSubscription);
router.put('/platform/organizations/:id/subscription', ...superAdminOnly, assignSubscription);
router.post('/platform/companies/:id/subscription', ...superAdminOnly, assignSubscription);
router.put('/platform/companies/:id/subscription', ...superAdminOnly, assignSubscription);
router.patch('/platform/subscriptions/:id/status', ...superAdminOnly, updateSubscriptionStatus);

// Payments Management
router.get('/platform/payments', ...superAdminOnly, getSubscriptionPayments);
router.post('/platform/payments', ...superAdminOnly, recordPayment);

// Companies Onboarding & Management (aliases: /companies and /organizations)
router.get('/platform/companies', ...superAdminOnly, getOrganizations);
router.post('/platform/companies', ...superAdminOnly, provisionOrganization);
router.get('/platform/companies/:id', ...superAdminOnly, getOrganizationById);
router.patch('/platform/companies/:id/status', ...superAdminOnly, updateOrgStatus);
router.post('/platform/companies/:id/admins', ...superAdminOnly, addOrganizationAdmin);
router.delete('/platform/companies/:id', ...superAdminOnly, deleteOrganization);

router.get('/platform/organizations', ...superAdminOnly, getOrganizations);
router.post('/platform/organizations', ...superAdminOnly, provisionOrganization);
router.get('/platform/organizations/:id', ...superAdminOnly, getOrganizationById);
router.patch('/platform/organizations/:id/status', ...superAdminOnly, updateOrgStatus);
router.delete('/platform/organizations/:id', ...superAdminOnly, deleteOrganization);

// ============================================================
// COMPANY ADMIN ENDPOINTS (Tenant-Scoped)
// ============================================================

// Company Admin subscription, usage, remaining capacity, upgrade details
router.get('/company/subscription', requireAuth, getCurrentCompanySubscription);

// Company profile view and edit
router.get('/company/profile', requireAuth, getCompanyProfile);
router.put('/company/profile', requireAuth, updateCompanyProfile);

module.exports = router;
