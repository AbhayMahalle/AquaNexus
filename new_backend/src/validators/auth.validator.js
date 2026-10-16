const { body } = require('express-validator');

const validateLogin = [
  body('email')
    .optional()
    .trim(),
  body('username')
    .optional()
    .trim(),
  body().custom((value) => {
    const identifier = (value.email || value.username || '').trim();
    if (!identifier) {
      throw new Error('Email or username is required');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
  validateLogin
};
