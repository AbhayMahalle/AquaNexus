const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/apiResponse');
const prisma = require('../config/db');

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Authentication required', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user and include role and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        },
        managerAssignments: true
      }
    });

    if (!user) {
      return sendError(res, 'User not found', 401);
    }

    req.user = user;
    req.user.role = user.userRoles[0]?.role;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return sendError(res, 'Invalid or expired token', 401);
  }
};

module.exports = {
  requireAuth
};
