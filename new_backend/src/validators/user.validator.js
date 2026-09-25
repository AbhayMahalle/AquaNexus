const { body, param } = require('express-validator');

const validateCreateUser = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required').trim(),
  body('lastName').notEmpty().withMessage('Last name is required').trim(),
  body('roleId').isUUID().withMessage('Valid Role ID (UUID) is required'),
  body('phone').optional().isString().trim(),
  body('username').optional().isString().trim()
];

const validateUpdateUser = [
  param('id').isUUID().withMessage('Valid User ID (UUID) is required in parameters'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty').trim(),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty').trim(),
  body('roleId').optional().isUUID().withMessage('Valid Role ID (UUID) is required'),
  body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED']).withMessage('Status must be ACTIVE, INACTIVE, or SUSPENDED'),
  body('phone').optional().isString().trim(),
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
