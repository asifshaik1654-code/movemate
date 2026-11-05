const mongoose = require('mongoose');
const Task = require('../models/Task');
const Move = require('../models/Move');
const MoveMember = require('../models/MoveMember');
const Room = require('../models/Room');
const { logActivity } = require('./activityService');
const ApiError = require('../utils/apiError');

/**
 * Validate that a target user is an authorized member or owner of the move
 */
const validateMemberAssignment = async (moveId, targetUserId) => {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new ApiError(400, 'Invalid user ID format for assignment');
  }

  const move = await Move.findById(moveId);
  if (!move) {
    throw new ApiError(404, 'Associated moving plan not found');
  }

  // If target user is the move owner, allow
  if (move.userId.equals(targetUserId)) {
    return true;
  }

  // Otherwise check MoveMember
  const isMember = await MoveMember.exists({ moveId, userId: targetUserId });
  if (!isMember) {
    throw new ApiError(400, 'Assigned user is not an authorized member of this moving plan');
  }

  return true;
};

/**
 * Create a new task
 */
const createTask = async (moveId, userId, taskData) => {
  // Validate assignment if provided
  if (taskData.assignedTo) {
    await validateMemberAssignment(moveId, taskData.assignedTo);
  }

  // Validate room association if provided
  if (taskData.roomId) {
    const roomExists = await Room.exists({ _id: taskData.roomId, moveId });
    if (!roomExists) {
      throw new ApiError(400, 'Selected room does not exist in this moving plan');
    }
  }

  const payload = {
    moveId,
    ...taskData
  };

  if (taskData.status === 'Completed') {
    payload.completedAt = new Date();
  }

  const task = await Task.create(payload);

  await logActivity({
    moveId,
    userId,
    action: 'TASK_CREATED',
    details: `Created task "${task.title}" (${task.priority} priority)`,
    entityType: 'Task',
    entityId: task._id
  });

  return task.populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'roomId', select: 'name colorCode' }
  ]);
};

/**
 * Get all tasks for a move with filtering, overdue detection, and pagination
 */
const getMoveTasks = async (moveId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 50;
  const skip = (page - 1) * limit;

  const filter = { moveId };

  if (query.status) {
    filter.status = query.status;
  }
  if (query.priority) {
    filter.priority = query.priority;
  }
  if (query.isEssential !== undefined) {
    filter.isEssential = query.isEssential;
  }
  if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }
  if (query.roomId) {
    filter.roomId = query.roomId;
  }

  const now = new Date();

  // Overdue filter
  if (query.overdue === true) {
    filter.dueDate = { $lt: now };
    filter.status = { $ne: 'Completed' };
  }

  const sortOrder = query.sort || 'dueDate';

  const [tasks, total, overdueCount, completedCount, essentialCount] = await Promise.all([
    Task.find(filter)
      .sort(sortOrder)
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'name email')
      .populate('roomId', 'name colorCode'),
    Task.countDocuments(filter),
    Task.countDocuments({ moveId, dueDate: { $lt: now }, status: { $ne: 'Completed' } }),
    Task.countDocuments({ moveId, status: 'Completed' }),
    Task.countDocuments({ moveId, isEssential: true })
  ]);

  // Compute dynamic isOverdue flag for each item
  const enrichedTasks = tasks.map((task) => {
    const obj = task.toJSON();
    obj.isOverdue = Boolean(task.dueDate && new Date(task.dueDate) < now && task.status !== 'Completed');
    return obj;
  });

  return {
    tasks: enrichedTasks,
    metrics: {
      total,
      completed: completedCount,
      overdue: overdueCount,
      essential: essentialCount
    },
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1
    }
  };
};

/**
 * Get single task by ID
 */
const getTaskById = async (taskId) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid Task ID format');
  }

  const task = await Task.findById(taskId)
    .populate('assignedTo', 'name email')
    .populate('roomId', 'name colorCode');

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  return task;
};

/**
 * Update a task
 */
const updateTask = async (taskId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid Task ID format');
  }

  const existingTask = await Task.findById(taskId);
  if (!existingTask) {
    throw new ApiError(404, 'Task not found');
  }

  // Validate reassignment if changing
  if (updateData.assignedTo && !existingTask.assignedTo?.equals(updateData.assignedTo)) {
    await validateMemberAssignment(existingTask.moveId, updateData.assignedTo);
  }

  // Handle completion timestamp
  if (updateData.status === 'Completed' && existingTask.status !== 'Completed') {
    updateData.completedAt = new Date();
  } else if (updateData.status && updateData.status !== 'Completed' && existingTask.status === 'Completed') {
    updateData.completedAt = null;
  }

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate([
    { path: 'assignedTo', select: 'name email' },
    { path: 'roomId', select: 'name colorCode' }
  ]);

  const action = updateData.status === 'Completed' ? 'TASK_COMPLETED' : 'TASK_UPDATED';
  await logActivity({
    moveId: existingTask.moveId,
    userId,
    action,
    details: `Task "${updatedTask.title}" status is now ${updatedTask.status}`,
    entityType: 'Task',
    entityId: updatedTask._id
  });

  return updatedTask;
};

/**
 * Delete a task
 */
const deleteTask = async (taskId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    throw new ApiError(400, 'Invalid Task ID format');
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await Task.findByIdAndDelete(taskId);

  await logActivity({
    moveId: task.moveId,
    userId,
    action: 'TASK_DELETED',
    details: `Deleted task "${task.title}"`,
    entityType: 'Task',
    entityId: taskId
  });

  return { deleted: true, taskId };
};

module.exports = {
  createTask,
  getMoveTasks,
  getTaskById,
  updateTask,
  deleteTask
};

