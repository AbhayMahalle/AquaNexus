const prisma = require("../config/db");

/**
 * Creates an audit log entry in the database.
 * 
 * @param {Object} params
 * @param {string} params.userId - UUID of the user performing the action (optional for system actions)
 * @param {string} params.action - The action performed (e.g., 'LOGIN', 'CREATE', 'UPDATE', 'DELETE')
 * @param {string} params.entityType - The type of entity affected (e.g., 'USER', 'PRODUCT', 'ORDER')
 * @param {string} params.entityId - UUID of the specific entity affected (optional)
 * @param {Object} params.oldValues - JSON representation of the entity state before the action (optional)
 * @param {Object} params.newValues - JSON representation of the entity state after the action (optional)
 * @param {string} params.ipAddress - The IP address of the requester (optional)
 * @returns {Promise<Object>} The created audit log
 */
const createAuditLog = async ({
  userId,
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
        action,
        entityType,
        entityId,
        oldValues: oldValues || null,
        newValues: newValues || null,
        ipAddress: ipAddress || null,
      },
    });
    return auditLog;
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // We intentionally do not throw the error to prevent audit failures from breaking business logic.
    return null;
  }
};

module.exports = {
  createAuditLog,
};
