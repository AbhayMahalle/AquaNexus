const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get leave records with filtering and pagination
 */
const getLeaves = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId,
      status,
      leaveType,
      startDate,
      endDate
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (leaveType) {
      where.leaveType = leaveType;
    }

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        skip,
        take,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              designation: true,
              department: { select: { id: true, name: true } }
            }
          },
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.leave.count({ where })
    ]);

    return sendSuccess(res, {
      leaves,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Leaves retrieved successfully');
  } catch (error) {
    console.error('getLeaves error:', error);
    return sendError(res, 'Failed to retrieve leaves', 500);
  }
};

/**
 * Create leave request
 */
const createLeave = async (req, res) => {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
      return sendError(res, 'employeeId, leaveType, startDate, endDate, and reason are required', 400);
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return sendError(res, 'Employee not found', 404);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return sendError(res, 'End date cannot be earlier than start date', 400);
    }

    const newLeave = await prisma.leave.create({
      data: {
        employeeId,
        leaveType,
        startDate: start,
        endDate: end,
        reason,
        status: 'PENDING'
      },
      include: {
        employee: true
      }
    });

    return sendSuccess(res, newLeave, 'Leave request submitted successfully', 201);
  } catch (error) {
    console.error('createLeave error:', error);
    return sendError(res, 'Failed to submit leave request', 500);
  }
};

/**
 * Update leave status (Approve / Reject / Cancel)
 */
const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'CANCELLED', 'PENDING'].includes(status)) {
      return sendError(res, 'Invalid leave status', 400);
    }

    const existingLeave = await prisma.leave.findUnique({ where: { id } });
    if (!existingLeave) {
      return sendError(res, 'Leave record not found', 404);
    }

    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status,
        ...(status === 'APPROVED' || status === 'REJECTED'
          ? { approvedBy: req.user ? req.user.id : null, approvedAt: new Date() }
          : {})
      },
      include: {
        employee: true,
        approver: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return sendSuccess(res, updatedLeave, `Leave status updated to ${status}`);
  } catch (error) {
    console.error('updateLeaveStatus error:', error);
    return sendError(res, 'Failed to update leave status', 500);
  }
};

module.exports = {
  getLeaves,
  createLeave,
  updateLeaveStatus
};
