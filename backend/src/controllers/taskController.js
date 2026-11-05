const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const taskService = require('../services/taskService');

/**
 * POST /api/v1/moves/:moveId/tasks
 */
const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.params.moveId, req.user._id, req.body);
  return new ApiResponse(201, 'Task created successfully', task).send(res);
});

/**
 * GET /api/v1/moves/:moveId/tasks
 */
const getTasks = asyncHandler(async (req, res) => {
  const result = await taskService.getMoveTasks(req.params.moveId, req.query);
  return new ApiResponse(200, 'Tasks retrieved successfully', result).send(res);
});

/**
 * GET /api/v1/tasks/:taskId
 */
const getTask = asyncHandler(async (req, res) => {
  const task = await taskService.getTaskById(req.params.taskId);
  return new ApiResponse(200, 'Task retrieved successfully', task).send(res);
});

/**
 * PATCH /api/v1/tasks/:taskId
 */
const updateTask = asyncHandler(async (req, res) => {
  const updatedTask = await taskService.updateTask(req.params.taskId, req.user._id, req.body);
  return new ApiResponse(200, 'Task updated successfully', updatedTask).send(res);
});

/**
 * DELETE /api/v1/tasks/:taskId
 */
const deleteTask = asyncHandler(async (req, res) => {
  const result = await taskService.deleteTask(req.params.taskId, req.user._id);
  return new ApiResponse(200, 'Task deleted successfully', result).send(res);
});

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask
};

