const express = require("express");
const {
  getDispatches,
  createDispatch,
  updateDispatchStatus
} = require("../controllers/dispatch.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");
const { requireManagerArea } = require("../middleware/managerAccess.middleware");

const { requireTenantContext } = require("../middleware/tenant.middleware");

const router = express.Router();

router.use(requireAuth);
router.use(requireTenantContext);
router.use(requireManagerArea("DISTRIBUTION"));

router.get("/", requireRole(["ADMIN", "MANAGER", "STORE_MANAGER", "DISTRIBUTOR"]), getDispatches);
router.post("/", requireRole(["ADMIN", "MANAGER", "STORE_MANAGER"]), createDispatch);
router.patch("/:id/status", requireRole(["ADMIN", "MANAGER"]), updateDispatchStatus);

module.exports = router;
