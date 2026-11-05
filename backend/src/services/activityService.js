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

/**
 * Get paginated activity timeline for a move
 * @param {string} moveId
 * @param {object} query - { page, limit, entityType, action }
 */
const getMoveActivity = async (moveId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const filter = { moveId };
  if (query.entityType) filter.entityType = query.entityType;
  if (query.action) filter.action = query.action;

  const [activities, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
    ActivityLog.countDocuments(filter)
  ]);

  return {
    activities,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
};

module.exports = {
  logActivity,
  getMoveActivity
};

