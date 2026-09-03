/**
 * Standard API Response Format
 * Success: { success: true, data: {}, message: 'Success' }
 * Error: { success: false, data: null, message: 'Error message' }
 */

const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

const sendError = (res, message = 'Something went wrong', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message
  });
};

module.exports = {
  sendSuccess,
  sendError
};
