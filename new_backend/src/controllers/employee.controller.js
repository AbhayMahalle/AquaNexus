const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * Get all employees with pagination, search, and filtering
 */
const getEmployees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      status,
      employmentType
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where = {};

    if (req.user && req.user.role?.name === 'EMPLOYEE') {
      if (!req.user.employee || !req.user.employee.id) {
        return sendError(res, 'Employee profile not found for this user', 403);
      }
      where.id = req.user.employee.id;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }

    if (employmentType) {
      where.employmentType = employmentType;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { employeeCode: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { designation: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take,
        include: {
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.employee.count({ where })
    ]);

    return sendSuccess(res, {
      employees,
      data: employees,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / take)
      }
    }, 'Employees retrieved successfully');
  } catch (error) {
    console.error('getEmployees error:', error);
    return sendError(res, 'Failed to retrieve employees', 500);
  }
};

/**
 * Get employee by ID
 */
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    // RBAC: Data scoping for employees
    if (req.user && req.user.role?.name === 'EMPLOYEE') {
      if (!req.user.employee || !req.user.employee.id) {
        return sendError(res, 'Employee profile not found for this user', 403);
      }
      if (req.user.employee.id !== id) {
        return sendError(res, 'Access denied to other employee profiles', 403);
      }
    }

    let targetId = id;
    if (id === 'me') {
      const myEmp = req.user?.employee || (req.user?.id ? await prisma.employee.findUnique({ where: { userId: req.user.id } }) : null);
      if (!myEmp) {
        return sendError(res, 'Employee profile not found for this user', 404);
      }
      targetId = myEmp.id;
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);
    const where = isUuid
      ? { OR: [{ id: targetId }, { employeeCode: targetId }] }
      : { employeeCode: targetId };

    const employee = await prisma.employee.findFirst({
      where,
      include: {
        department: true,
        attendances: {
          take: 10,
          orderBy: { attendanceDate: 'desc' }
        },
        leaves: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        overtimes: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!employee) {
      return sendError(res, 'Employee not found', 404);
    }

    return sendSuccess(res, { employee, data: employee }, 'Employee details retrieved successfully');
  } catch (error) {
    console.error('getEmployeeById error:', error);
    return sendError(res, 'Failed to retrieve employee details', 500);
  }
};

/**
 * Create new employee
 */
const createEmployee = async (req, res) => {
  try {
    const {
      employeeCode,
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      department: departmentName,
      designation = 'Staff',
      joiningDate,
      employmentType = 'PERMANENT',
      status = 'ACTIVE'
    } = req.body;

    if (!firstName || !lastName) {
      return sendError(res, 'First name and last name are required', 400);
    }

    // Resolve department: by ID, by Name, or fallback to first active department
    let targetDept = null;
    if (departmentId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(departmentId);
      if (isUuid) {
        targetDept = await prisma.department.findUnique({ where: { id: departmentId } });
      }
    }
    if (!targetDept && departmentName) {
      targetDept = await prisma.department.findFirst({
        where: { name: { equals: departmentName, mode: 'insensitive' } }
      });
    }
    if (!targetDept) {
      targetDept = await prisma.department.findFirst({ where: { status: 'ACTIVE' } });
    }

    if (!targetDept) {
      return sendError(res, 'No active department found to assign employee to', 400);
    }

    // Generate code if not provided
    let code = employeeCode;
    if (!code) {
      const count = await prisma.employee.count();
      code = `EMP${String(count + 1).padStart(3, '0')}`;
    }

    // Check if code exists
    const existingCode = await prisma.employee.findUnique({
      where: { employeeCode: code }
    });
    if (existingCode) {
      return sendError(res, `Employee code '${code}' already exists`, 400);
    }

    const resolvedJoiningDate = joiningDate ? new Date(joiningDate) : new Date();

    const newEmployee = await prisma.employee.create({
      data: {
        employeeCode: code,
        firstName,
        lastName,
        email: email || `${firstName.toLowerCase()}.${Date.now().toString().slice(-4)}@aquanexus.com`,
        phone: phone || '9876543210',
        departmentId: targetDept.id,
        designation,
        joiningDate: resolvedJoiningDate,
        employmentType,
        status
      },
      include: {
        department: true
      }
    });

    return sendSuccess(res, { employee: newEmployee, data: newEmployee }, 'Employee created successfully', 201);
  } catch (error) {
    console.error('createEmployee error:', error);
    return sendError(res, 'Failed to create employee', 500);
  }
};

/**
 * Update employee details
 */
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      designation,
      joiningDate,
      employmentType,
      status
    } = req.body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return sendError(res, 'Employee not found', 404);
    }

    if (departmentId) {
      const deptExists = await prisma.department.findUnique({ where: { id: departmentId } });
      if (!deptExists) {
        return sendError(res, 'Invalid department ID', 400);
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(departmentId && { departmentId }),
        ...(designation && { designation }),
        ...(joiningDate && { joiningDate: new Date(joiningDate) }),
        ...(employmentType && { employmentType }),
        ...(status && { status })
      },
      include: {
        department: true
      }
    });

    return sendSuccess(res, { employee: updatedEmployee, data: updatedEmployee }, 'Employee updated successfully');
  } catch (error) {
    console.error('updateEmployee error:', error);
    return sendError(res, 'Failed to update employee', 500);
  }
};

/**
 * Get all departments
 */
const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });

    return sendSuccess(res, { departments, data: departments }, 'Departments retrieved successfully');
  } catch (error) {
    console.error('getDepartments error:', error);
    return sendError(res, 'Failed to retrieve departments', 500);
  }
};

/**
 * Delete / deactivate employee
 */
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const existing = await prisma.employee.findFirst({
      where: isUuid ? { OR: [{ id }, { employeeCode: id }] } : { employeeCode: id }
    });

    if (!existing) {
      return sendError(res, 'Employee not found', 404);
    }

    try {
      await prisma.employee.delete({ where: { id: existing.id } });
    } catch {
      await prisma.employee.update({
        where: { id: existing.id },
        data: { status: 'TERMINATED' }
      });
    }

    return sendSuccess(res, { success: true }, 'Employee removed successfully');
  } catch (error) {
    console.error('deleteEmployee error:', error);
    return sendError(res, 'Failed to remove employee', 500);
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  getDepartments,
  deleteEmployee
};
