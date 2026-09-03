const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const assignManagerArea = async (req, res) => {
  try {
    const { userId, area } = req.body;

    if (!userId || !area) {
      return sendError(res, 'User ID and area are required', 400);
    }

    const assignment = await prisma.managerAssignment.create({
      data: {
        userId: parseInt(userId),
        area
      }
    });

    return sendSuccess(res, { assignment }, 'Area assigned successfully', 201);
  } catch (error) {
    if (error.code === 'P2002') {
      return sendError(res, 'This area is already assigned to this user', 400);
    }
    console.error('assignManagerArea error:', error);
    return sendError(res, 'Failed to assign area', 500);
  }
};

const getManagerAssignments = async (req, res) => {
  try {
    const { userId } = req.params;

    const assignments = await prisma.managerAssignment.findMany({
      where: { userId: parseInt(userId) }
    });

    return sendSuccess(res, { assignments }, 'Assignments retrieved successfully');
  } catch (error) {
    console.error('getManagerAssignments error:', error);
    return sendError(res, 'Failed to retrieve assignments', 500);
  }
};

module.exports = {
  assignManagerArea,
  getManagerAssignments
};
