const prisma = require('../config/db');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType, userId } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);
    
    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, username: true } }
        }
      }),
      prisma.auditLog.count({ where })
    ]);

    return sendSuccess(res, 'Audit logs fetched', {
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return sendError(res, 'Failed to fetch audit logs', 500);
  }
};

module.exports = { getAuditLogs };
