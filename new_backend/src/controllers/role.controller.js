const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    return sendSuccess(res, { roles }, 'Roles retrieved successfully');
  } catch (error) {
    console.error('getRoles error:', error);
    return sendError(res, 'Failed to retrieve roles', 500);
  }
};

const getPermissions = async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany();
    return sendSuccess(res, { permissions }, 'Permissions retrieved successfully');
  } catch (error) {
    console.error('getPermissions error:', error);
    return sendError(res, 'Failed to retrieve permissions', 500);
  }
};

module.exports = {
  getRoles,
  getPermissions
};
