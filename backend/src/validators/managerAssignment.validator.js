const { body, param } = require('express-validator');

const validAreas = ['PRODUCTION', 'STORE', 'DISTRIBUTION'];

const validateAssignArea = [
  body('userId').isUUID().withMessage('Valid User ID (UUID) is required'),
  body('area').isIn(validAreas).withMessage(`Area must be one of: ${validAreas.join(', ')}`)
];

const validateUpdateArea = [
  param('id').isUUID().withMessage('Valid Assignment ID (UUID) is required'),
  body('area').isIn(validAreas).withMessage(`Area must be one of: ${validAreas.join(', ')}`)
];

const validateIdParam = [
  param('id').isUUID().withMessage('Valid ID (UUID) is required')
];

const validateUserIdParam = [
  param('userId').isUUID().withMessage('Valid User ID (UUID) is required')
];

module.exports = {
  validateAssignArea,
  validateUpdateArea,
  validateIdParam,
  validateUserIdParam
};
