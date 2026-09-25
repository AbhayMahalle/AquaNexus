const { validationResult } = require('express-validator');
const { sendError } = require('./apiResponse');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format errors to a single string or return the array, keeping it simple
    const errorMsg = errors.array().map(e => `${e.path}: ${e.msg}`).join(', ');
    return sendError(res, `Validation failed: ${errorMsg}`, 422);
  }
  next();
};

module.exports = { validate };
