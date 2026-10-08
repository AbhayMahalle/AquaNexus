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
      data: attendance,
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
    const { records, employeeId, attendanceDate, date, status, checkIn, checkOut, remarks, notes } = req.body;

    const defaultEmpId = (req.user && req.user.role?.name === 'EMPLOYEE' && req.user.employee?.id) ? req.user.employee.id : employeeId;
    const defaultDate = attendanceDate || date;
    const defaultRemarks = remarks !== undefined ? remarks : notes;

    // Single record mode or bulk records array mode
    const attendanceItems = Array.isArray(records) ? records : [{
      employeeId: defaultEmpId,
      attendanceDate: defaultDate,
      status: status || 'PRESENT',
      checkIn,
      checkOut,
      remarks: defaultRemarks
    }];

    if (attendanceItems.length === 0 || !attendanceItems[0].employeeId || !attendanceItems[0].attendanceDate || !attendanceItems[0].status) {
      return sendError(res, 'employeeId, attendanceDate, and status are required for each attendance record', 400);
    }

    const results = [];

    const parseDateTime = (val, baseDate) => {
      if (!val) return undefined;
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
      const timeMatch = String(val).match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
      if (timeMatch) {
        let [_, hours, minutes, meridiem] = timeMatch;
        let h = parseInt(hours, 10);
        const m = parseInt(minutes, 10);
        if (meridiem) {
          if (meridiem.toUpperCase() === 'PM' && h < 12) h += 12;
          if (meridiem.toUpperCase() === 'AM' && h === 12) h = 0;
        }
        const combined = new Date(baseDate);
        combined.setHours(h, m, 0, 0);
        return combined;
      }
      return undefined;
    };

    for (const item of attendanceItems) {
      const dateObj = new Date(item.attendanceDate);

      let empId = item.employeeId;
      let targetUserId = null;
      if (req.user && req.user.role?.name === 'EMPLOYEE') {
        if (!req.user.employee || !req.user.employee.id) {
          return sendError(res, 'Employee profile not found for this user', 403);
        }
        empId = req.user.employee.id;
        targetUserId = req.user.id;
      } else {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.employeeId);
        const emp = await prisma.employee.findFirst({
          where: isUuid
            ? { OR: [{ id: item.employeeId }, { employeeCode: item.employeeId }], organizationId: req.organizationId }
            : { employeeCode: item.employeeId, organizationId: req.organizationId },
        });
        if (!emp) {
          return sendError(res, `Employee ${item.employeeId} not found in your organization`, 404);
        }
        empId = emp.id;
        targetUserId = emp.userId;
      }

      const parsedCheckIn = parseDateTime(item.checkIn, dateObj);
      const parsedCheckOut = parseDateTime(item.checkOut, dateObj);

      const record = await prisma.attendance.upsert({
        where: {
          employeeId_attendanceDate: {
            employeeId: empId,
            attendanceDate: dateObj
          }
        },
        update: {
          status: item.status,
          ...(parsedCheckIn && { checkIn: parsedCheckIn }),
          ...(parsedCheckOut && { checkOut: parsedCheckOut }),
          ...(item.remarks !== undefined && { remarks: item.remarks })
        },
        create: {
          organizationId: req.organizationId,
          employeeId: empId,
          attendanceDate: dateObj,
          status: item.status,
          ...(parsedCheckIn && { checkIn: parsedCheckIn }),
          ...(parsedCheckOut && { checkOut: parsedCheckOut }),
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
      
      if (targetUserId && targetUserId !== req.user.id) {
        try {
          await prisma.notification.create({
            data: {
              organizationId: req.organizationId,
              userId: targetUserId,
              title: 'Attendance Updated',
              message: `Your attendance for ${dateObj.toLocaleDateString()} was marked as ${item.status}.`,
              type: 'INFO'
            }
          });
        } catch (e) {
          console.error("Failed to create notification:", e);
        }
      }
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
