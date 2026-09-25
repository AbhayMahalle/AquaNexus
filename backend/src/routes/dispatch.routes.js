const express = require("express");
const {
  getDispatches,
  createDispatch,
} = require("../controllers/dispatch.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/rbac.middleware");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole(["ADMIN", "MANAGER", "STORE_MANAGER"]));

router.get("/", getDispatches);
router.post("/", createDispatch);

module.exports = router;
