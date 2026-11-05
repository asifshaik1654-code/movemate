const mongoose = require('mongoose');
const Move = require('../models/Move');
const MoveMember = require('../models/MoveMember');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants/roles');

// Role hierarchy weights: Owner (3) > Editor (2) > Viewer (1)
const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 3,
  [ROLES.EDITOR]: 2,
  [ROLES.VIEWER]: 1
};

/**
 * Middleware to verify that the authenticated user has access to the specified moveId.
 * Checks params.moveId, query.moveId, or body.moveId.
 * @param {'Viewer' | 'Editor' | 'Owner'} requiredRole - Minimum role required
 */
const checkMoveAccess = (requiredRole = ROLES.VIEWER) => {
  return asyncHandler(async (req, res, next) => {
    const moveId = req.params.moveId || req.body.moveId || req.query.moveId;

    if (!moveId) {
      return next(new ApiError(400, 'Move ID is required'));
    }

    if (!mongoose.Types.ObjectId.isValid(moveId)) {
      return next(new ApiError(400, 'Invalid Move ID format'));
    }

    const move = await Move.findById(moveId);
    if (!move) {
      return next(new ApiError(404, 'Moving plan not found'));
    }

    // Check if user is the Owner directly
    if (move.userId.equals(req.user._id)) {
      req.move = move;
      req.userMoveRole = ROLES.OWNER;
      return next();
    }

    // Check if user is a registered member of this move
    const membership = await MoveMember.findOne({
      moveId: move._id,
      userId: req.user._id
    });

    if (!membership) {
      return next(new ApiError(403, 'You do not have access to this moving plan'));
    }

    const userWeight = ROLE_HIERARCHY[membership.role] || 0;
    const requiredWeight = ROLE_HIERARCHY[requiredRole] || 1;

    if (userWeight < requiredWeight) {
      return next(
        new ApiError(
          403,
          `Action requires '${requiredRole}' privileges. Your current role is '${membership.role}'.`
        )
      );
    }

    req.move = move;
    req.userMoveRole = membership.role;
    next();
  });
};

/**
 * Middleware to verify that the user has access to a specific task's parent move
 * @param {'Viewer' | 'Editor' | 'Owner'} requiredRole
 */
const checkTaskAccess = (requiredRole = ROLES.EDITOR) => {
  return asyncHandler(async (req, res, next) => {
    const { taskId } = req.params;

    if (!taskId || !mongoose.Types.ObjectId.isValid(taskId)) {
      return next(new ApiError(400, 'Invalid Task ID format'));
    }

    const Task = require('../models/Task');
    const task = await Task.findById(taskId);
    if (!task) {
      return next(new ApiError(404, 'Task not found'));
    }

    // Check parent move access
    const move = await Move.findById(task.moveId);
    if (!move) {
      return next(new ApiError(404, 'Parent moving plan not found'));
    }

    if (move.userId.equals(req.user._id)) {
      req.task = task;
      req.move = move;
      req.userMoveRole = ROLES.OWNER;
      return next();
    }

    const membership = await MoveMember.findOne({
      moveId: move._id,
      userId: req.user._id
    });

    if (!membership) {
      return next(new ApiError(403, 'You do not have permission to access tasks in this moving plan'));
    }

    const userWeight = ROLE_HIERARCHY[membership.role] || 0;
    const requiredWeight = ROLE_HIERARCHY[requiredRole] || 2;

    if (userWeight < requiredWeight) {
      return next(
        new ApiError(
          403,
          `Action requires '${requiredRole}' privileges. Your current role is '${membership.role}'.`
        )
      );
    }

    req.task = task;
    req.move = move;
    req.userMoveRole = membership.role;
    next();
  });
};

/**
 * Convenience middleware: Enforce Owner only
 */
const requireMoveOwner = checkMoveAccess(ROLES.OWNER);

module.exports = {
  checkMoveAccess,
  checkTaskAccess,
  requireMoveOwner
};
