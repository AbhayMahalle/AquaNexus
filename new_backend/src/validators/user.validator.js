const { body, param } = require('express-validator');

const validateCreateUser = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('roleId').notEmpty().withMessage('Role is required').trim(),
  body('phone')
    .optional({ checkFalsy: true })
    .custom((val) => {
      const digits = (val || '').replace(/\D/g, '');
      const clean = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : (digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits);
      if (clean.length !== 10) {
        throw new Error('Phone number must be of 10 digits');
      }
      return true;
    }),
  body('username').optional().isString().trim()
];

const validateUpdateUser = [
  param('id').isUUID().withMessage('Valid User ID (UUID) is required in parameters'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty').trim(),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty').trim(),
  body('roleId').optional().notEmpty().withMessage('Role is required').trim(),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Status must be ACTIVE, INACTIVE, or SUSPENDED'),
  body('phone')
    .optional({ checkFalsy: true })
    .custom((val) => {
      const digits = (val || '').replace(/\D/g, '');
      const clean = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : (digits.length === 11 && digits.startsWith('0') ? digits.slice(1) : digits);
      if (clean.length !== 10) {
        throw new Error('Phone number must be of 10 digits');
      }
      return true;
    }),
  body('username').optional().isString().trim()
];

const validateUserIdParam = [
  param('id').isUUID().withMessage('Valid User ID (UUID) is required')
];

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateUserIdParam
};
