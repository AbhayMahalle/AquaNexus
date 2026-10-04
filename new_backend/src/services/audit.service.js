const prisma = require("../config/db");

/**
 * Creates an audit log entry in the database.
 * 
 * @param {Object} params
 * @param {string} params.userId - UUID of the user performing the action
 * @param {string} params.organizationId - UUID of the tenant organization
 * @param {string} params.action - The action performed (e.g., 'LOGIN', 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} params.entityType - The type of entity affected (e.g., 'USER', 'PRODUCT', 'ORDER')
 * @param {string} params.entityId - UUID of the specific entity affected
 * @param {Object} params.oldValues - JSON representation of the entity state before the action
 * @param {Object} params.newValues - JSON representation of the entity state after the action
 * @param {string} params.ipAddress - The IP address of the requester
 * @returns {Promise<Object>} The created audit log
 */
const createAuditLog = async ({
  userId,
  organizationId,
  action,
  entityType,
  entityId,
  oldValues,
  newValues,
  ipAddress,
}) => {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        organizationId: organizationId || null,
        action,
        entityType,
        entityId: entityId || "SYSTEM",
        oldValues: oldValues || null,
        newValues: newValues || null,
        ipAddress: ipAddress || null,
      },
    });
    return auditLog;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    return null;
  }
};

const logAction = async (userId, action, entityType, entityId, oldValues, newValues, req) => {
  return createAuditLog({
    userId,
    organizationId: req?.organizationId || req?.user?.organizationId || null,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    ipAddress: req?.ip,
  });
};

module.exports = {
  createAuditLog,
  logAction,
};
