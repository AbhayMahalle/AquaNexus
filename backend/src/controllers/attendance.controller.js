const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get attendance records with filters and pagination
 */
const getAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      employeeId,
      departmentId,
      startDate,
      endDate,
      status
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

    if (departmentId) {
      where.employee = { departmentId };
    }

    if (startDate || endDate) {
      where.attendanceDate = {};
      if (startDate) {
        where.attendanceDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.attendanceDate.lte = new Date(endDate);
      }
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
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
              department: {
                select: { id: true, name: true, code: true }
              }
            }
          }
        },
        orderBy: { attendanceDate: 'desc' }
      }),
      prisma.attendance.count({ where })
    ]);

    return sendSuccess(res, {
      attendance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Attendance records retrieved successfully');
  } catch (error) {
    console.error('getAttendance error:', error);
    return sendError(res, 'Failed to retrieve attendance records', 500);
  }
};

/**
 * Record or bulk record attendance
 */
const recordAttendance = async (req, res) => {
  try {
    const { records, employeeId, attendanceDate, status, checkIn, checkOut, remarks } = req.body;

    // Single record mode or bulk records array mode
    const attendanceItems = Array.isArray(records) ? records : [{
      employeeId,
      attendanceDate,
      status,
      checkIn,
      checkOut,
      remarks
    }];

    if (attendanceItems.length === 0 || !attendanceItems[0].employeeId || !attendanceItems[0].attendanceDate || !attendanceItems[0].status) {
      return sendError(res, 'employeeId, attendanceDate, and status are required for each attendance record', 400);
    }

    const results = [];

    for (const item of attendanceItems) {
      const dateObj = new Date(item.attendanceDate);

      const record = await prisma.attendance.upsert({
        where: {
          employeeId_attendanceDate: {
            employeeId: item.employeeId,
            attendanceDate: dateObj
          }
        },
        update: {
          status: item.status,
          ...(item.checkIn && { checkIn: new Date(item.checkIn) }),
          ...(item.checkOut && { checkOut: new Date(item.checkOut) }),
          ...(item.remarks !== undefined && { remarks: item.remarks })
        },
        create: {
          employeeId: item.employeeId,
          attendanceDate: dateObj,
          status: item.status,
          ...(item.checkIn && { checkIn: new Date(item.checkIn) }),
          ...(item.checkOut && { checkOut: new Date(item.checkOut) }),
          remarks: item.remarks
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });
      results.push(record);
    }

    return sendSuccess(
      res,
      Array.isArray(records) ? results : results[0],
      'Attendance recorded successfully',
      201
    );
  } catch (error) {
    console.error('recordAttendance error:', error);
    return sendError(res, 'Failed to record attendance', 500);
  }
};

module.exports = {
  getAttendance,
  recordAttendance
};
