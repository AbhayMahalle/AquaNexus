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

    const where = {
      organizationId: req.organizationId,
    };

    // RBAC: Data scoping for employees
    if (req.user && req.user.role?.name === 'EMPLOYEE') {
      if (!req.user.employee || !req.user.employee.id) {
        return sendError(res, 'Employee profile not found for this user', 403);
      }
      where.employeeId = req.user.employee.id;
    } else if (employeeId) {
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

    const [rawOvertimes, total] = await Promise.all([
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

    const overtimes = rawOvertimes.map(ot => {
      const match = ot.reason?.match(/\[Multiplier:\s*([0-9.]+)x\]/i);
      const mult = match ? parseFloat(match[1]) : 1.5;
      const baseHourlyRate = 150;
      const payrollAmount = Number(ot.hours) * baseHourlyRate * mult;
      return {
        ...ot,
        rateMultiplier: mult,
        payrollAmount
      };
    });

    return sendSuccess(res, {
      overtimes,
      data: overtimes,
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
    const { employeeId, overtimeDate, hours, reason, rateMultiplier } = req.body;

    let empId = employeeId;
    if (req.user && req.user.role?.name === 'EMPLOYEE') {
      if (!req.user.employee || !req.user.employee.id) {
        return sendError(res, 'Employee profile not found for this user', 403);
      }
      empId = req.user.employee.id;
    }

    if (!empId || !overtimeDate || hours === undefined) {
      return sendError(res, 'employeeId, overtimeDate, and hours are required', 400);
    }

    const numHours = parseFloat(hours);
    if (isNaN(numHours) || numHours <= 0) {
      return sendError(res, 'Hours must be a positive number', 400);
    }

    if (req.user?.role?.name !== 'EMPLOYEE') {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(employeeId);
      const employee = await prisma.employee.findFirst({
        where: isUuid
          ? { OR: [{ id: employeeId }, { employeeCode: employeeId }], organizationId: req.organizationId }
          : { employeeCode: employeeId, organizationId: req.organizationId }
      });
      if (!employee) {
        return sendError(res, 'Employee not found in your organization', 404);
      }
      empId = employee.id;
    }

    let finalReason = reason || 'Shift overtime work';
    let mult = 1.5;
    if (rateMultiplier !== undefined && rateMultiplier !== null) {
      const parsedMult = parseFloat(rateMultiplier);
      if (!isNaN(parsedMult)) {
        mult = parsedMult;
        if (!finalReason.includes(`[Multiplier: ${parsedMult.toFixed(1)}x]`)) {
          finalReason = `[Multiplier: ${parsedMult.toFixed(1)}x] ${finalReason}`;
        }
      }
    }

    const newOvertime = await prisma.overtime.create({
      data: {
        organizationId: req.organizationId,
        employeeId: empId,
        overtimeDate: new Date(overtimeDate),
        hours: numHours,
        reason: finalReason,
        status: 'PENDING'
      },
      include: {
        employee: true
      }
    });

    const baseHourlyRate = 150;
    const payrollAmount = Number(newOvertime.hours) * baseHourlyRate * mult;
    const formatted = {
      ...newOvertime,
      rateMultiplier: mult,
      payrollAmount
    };

    return sendSuccess(res, { overtime: formatted, data: formatted, ...formatted }, 'Overtime record created successfully', 201);
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

    const existingOvertime = await prisma.overtime.findFirst({
      where: { id, organizationId: req.organizationId },
    });
    if (!existingOvertime) {
      return sendError(res, 'Overtime record not found in your organization', 404);
    }

    if (req.user && req.user.role?.name === 'EMPLOYEE') {
      return sendError(res, 'Employees are not authorized to approve or reject overtime requests', 403);
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
