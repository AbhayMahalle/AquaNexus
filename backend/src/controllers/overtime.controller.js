const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get overtime records with filtering and pagination
 */
const getOvertime = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      employeeId,
      status,
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

    if (startDate || endDate) {
      where.overtimeDate = {};
      if (startDate) where.overtimeDate.gte = new Date(startDate);
      if (endDate) where.overtimeDate.lte = new Date(endDate);
    }

    const [overtimes, total] = await Promise.all([
      prisma.overtime.findMany({
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
      prisma.overtime.count({ where })
    ]);

    return sendSuccess(res, {
      overtimes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Overtime records retrieved successfully');
  } catch (error) {
    console.error('getOvertime error:', error);
    return sendError(res, 'Failed to retrieve overtime records', 500);
  }
};

/**
 * Create overtime record
 */
const createOvertime = async (req, res) => {
  try {
    const { employeeId, overtimeDate, hours, reason } = req.body;

    if (!employeeId || !overtimeDate || hours === undefined) {
      return sendError(res, 'employeeId, overtimeDate, and hours are required', 400);
    }

    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours <= 0) {
      return sendError(res, 'Hours must be a positive number', 400);
    }

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return sendError(res, 'Employee not found', 404);
    }

    const newOvertime = await prisma.overtime.create({
      data: {
        employeeId,
        overtimeDate: new Date(overtimeDate),
        hours: numHours,
        reason,
        status: 'PENDING'
      },
      include: {
        employee: true
      }
    });

    return sendSuccess(res, newOvertime, 'Overtime record created successfully', 201);
  } catch (error) {
    console.error('createOvertime error:', error);
    return sendError(res, 'Failed to create overtime record', 500);
  }
};

/**
 * Update overtime status (Approve / Reject)
 */
const updateOvertimeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return sendError(res, 'Invalid overtime status', 400);
    }

    const existingOvertime = await prisma.overtime.findUnique({ where: { id } });
    if (!existingOvertime) {
      return sendError(res, 'Overtime record not found', 404);
    }

    const updatedOvertime = await prisma.overtime.update({
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

    return sendSuccess(res, updatedOvertime, `Overtime status updated to ${status}`);
  } catch (error) {
    console.error('updateOvertimeStatus error:', error);
    return sendError(res, 'Failed to update overtime status', 500);
  }
};

module.exports = {
  getOvertime,
  createOvertime,
  updateOvertimeStatus
};
