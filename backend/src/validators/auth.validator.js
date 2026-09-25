const { body } = require('express-validator');

const validateLogin = [
  body('email').custom((value, { req }) => {
    const identifier = req.body.email || req.body.username;
    if (!identifier || typeof identifier !== 'string' || !identifier.trim()) {
      throw new Error('Email or username is required');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required')
];

module.exports = {
  validateLogin
};
