const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkMoveAccess, checkTaskAccess } = require('../middleware/moveAuthMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema
} = require('../validators/taskValidators');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask
} = require('../controllers/taskController');
const { ROLES } = require('../constants/roles');

// 1. Router for Move-scoped endpoints: /moves/:moveId/tasks
const moveTaskRouter = express.Router({ mergeParams: true });
moveTaskRouter.use(authenticate);

moveTaskRouter
  .route('/')
  .get(checkMoveAccess(ROLES.VIEWER), validate(taskQuerySchema, 'query'), getTasks)
  .post(checkMoveAccess(ROLES.EDITOR), validate(createTaskSchema), createTask);

// 2. Router for direct task endpoints: /tasks/:taskId
const directTaskRouter = express.Router();
directTaskRouter.use(authenticate);

directTaskRouter
  .route('/:taskId')
  .get(checkTaskAccess(ROLES.VIEWER), getTask)
  .patch(checkTaskAccess(ROLES.EDITOR), validate(updateTaskSchema), updateTask)
  .delete(checkTaskAccess(ROLES.EDITOR), deleteTask);

module.exports = {
  moveTaskRouter,
  directTaskRouter
};

