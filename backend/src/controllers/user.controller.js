const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        managerAssignments: true,
        createdAt: true,
      }
    });
    return sendSuccess(res, { users }, 'Users retrieved successfully');
  } catch (error) {
    console.error('getUsers error:', error);
    return sendError(res, 'Failed to retrieve users', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, roleId } = req.body;
    
    if (!email || !password || !firstName || !lastName || !roleId) {
      return sendError(res, 'Missing required fields', 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 'User with this email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        roleId: parseInt(roleId)
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    return sendSuccess(res, { user }, 'User created successfully', 201);
  } catch (error) {
    console.error('createUser error:', error);
    return sendError(res, 'Failed to create user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, roleId, password } = req.body;

    const dataToUpdate = {};
    if (email) dataToUpdate.email = email;
    if (firstName) dataToUpdate.firstName = firstName;
    if (lastName) dataToUpdate.lastName = lastName;
    if (roleId) dataToUpdate.roleId = parseInt(roleId);
    
    if (password) {
      dataToUpdate.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true
      }
    });

    return sendSuccess(res, { user }, 'User updated successfully');
  } catch (error) {
    console.error('updateUser error:', error);
    return sendError(res, 'Failed to update user', 500);
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser
};
