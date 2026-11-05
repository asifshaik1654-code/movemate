const Move = require('../models/Move');
const MoveMember = require('../models/MoveMember');
const Task = require('../models/Task');
const Room = require('../models/Room');
const Box = require('../models/Box');
const InventoryItem = require('../models/InventoryItem');
const Expense = require('../models/Expense');
const ServiceBooking = require('../models/ServiceBooking');
const ActivityLog = require('../models/ActivityLog');
const { ROLES } = require('../constants/roles');
const { logActivity } = require('./activityService');
const ApiError = require('../utils/apiError');

/**
 * Create a new moving plan
 */
const createMove = async (userId, moveData) => {
  const move = await Move.create({
    userId,
    ...moveData
  });

  // Automatically register creator as Owner in MoveMember
  await MoveMember.create({
    moveId: move._id,
    userId,
    role: ROLES.OWNER
  });

  // Record audit log
  await logActivity({
    moveId: move._id,
    userId,
    action: 'MOVE_CREATED',
    details: `Created moving plan "${move.title}"`,
    entityType: 'Move',
    entityId: move._id
  });

  return move;
};

/**
 * Get all moves owned by or shared with a user
 */
const getUserMoves = async (userId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  // Find move IDs where user is registered as a member
  const memberRecords = await MoveMember.find({ userId }).select('moveId role');
  const sharedMoveIds = memberRecords.map((m) => m.moveId);

  // Filter: user is owner OR user is a member
  const filter = {
    $or: [{ userId }, { _id: { $in: sharedMoveIds } }]
  };

  if (query.status) {
    filter.status = query.status;
  }

  const sortOrder = query.sort || '-createdAt';

  const [moves, total] = await Promise.all([
    Move.find(filter)
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .populate('userId', 'name email'),
    Move.countDocuments(filter)
  ]);

  // Attach user's role on each move
  const memberRoleMap = {};
  memberRecords.forEach((m) => {
    memberRoleMap[m.moveId.toString()] = m.role;
  });

  const enrichedMoves = moves.map((move) => {
    const obj = move.toJSON();
    obj.userRole = move.userId._id.equals(userId)
      ? ROLES.OWNER
      : memberRoleMap[move._id.toString()] || ROLES.VIEWER;
    return obj;
  });

  return {
    moves: enrichedMoves,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Get move details by ID
 */
const getMoveById = async (moveId) => {
  const move = await Move.findById(moveId).populate('userId', 'name email');
  if (!move) {
    throw new ApiError(404, 'Moving plan not found');
  }
  return move;
};

/**
 * Update moving plan details
 */
const updateMove = async (moveId, userId, updateData) => {
  const move = await Move.findByIdAndUpdate(moveId, { $set: updateData }, { new: true, runValidators: true });
  if (!move) {
    throw new ApiError(404, 'Moving plan not found');
  }

  await logActivity({
    moveId: move._id,
    userId,
    action: 'MOVE_UPDATED',
    details: `Updated moving plan details for "${move.title}"`,
    entityType: 'Move',
    entityId: move._id
  });

  return move;
};

/**
 * Delete a moving plan and safely cascade-delete all child records
 */
const deleteMove = async (moveId, userId) => {
  const move = await Move.findById(moveId);
  if (!move) {
    throw new ApiError(404, 'Moving plan not found');
  }

  // Cascade delete all child documents linked to this move
  await Promise.all([
    Task.deleteMany({ moveId }),
    Room.deleteMany({ moveId }),
    Box.deleteMany({ moveId }),
    InventoryItem.deleteMany({ moveId }),
    Expense.deleteMany({ moveId }),
    ServiceBooking.deleteMany({ moveId }),
    MoveMember.deleteMany({ moveId }),
    ActivityLog.deleteMany({ moveId }),
    Move.findByIdAndDelete(moveId)
  ]);

  return { deleted: true, moveId };
};

module.exports = {
  createMove,
  getUserMoves,
  getMoveById,
  updateMove,
  deleteMove
};

