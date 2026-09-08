const express = require('express');
const { login, me, logout } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateLogin } = require('../validators/auth.validator');
const { validate } = require('../utils/validate');

const router = express.Router();

router.post('/login', validateLogin, validate, login);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

module.exports = router;
