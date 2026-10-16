const express = require('express');
const { login, me, updateProfile, changePassword, logout } = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { validateLogin } = require('../validators/auth.validator');
const { validate } = require('../utils/validate');

const router = express.Router();

router.post('/login', validateLogin, validate, login);
router.get('/me', requireAuth, me);
router.put('/profile', requireAuth, updateProfile);
router.put('/change-password', requireAuth, changePassword);
router.post('/logout', requireAuth, logout);

module.exports = router;
