const ActivityLog = require('../models/ActivityLog');

/**
 * Log an action into the ActivityLog collection
 * @param {object} params
 * @param {string} params.moveId
 * @param {string} params.userId
 * @param {string} params.action - e.g. 'MOVE_CREATED', 'TASK_COMPLETED'
 * @param {string} params.details - Human readable description
 * @param {string} params.entityType - 'Move', 'Task', 'Box', etc.
 * @param {string} [params.entityId] - Target ObjectId
 */
const logActivity = async ({ moveId, userId, action, details, entityType, entityId = null }) => {
  try {
    await ActivityLog.create({
      moveId,
      userId,
      action,
      details,
      entityType,
      entityId
    });
  } catch (error) {
    // Activity logging should never crash the primary business operation
    console.warn(`⚠️ Failed to record activity log [${action}]:`, error.message);
  }
};

module.exports = {
  logActivity
};

