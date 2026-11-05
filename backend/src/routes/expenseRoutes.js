const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { checkMoveAccess, checkChildResourceAccess } = require('../middleware/moveAuthMiddleware');
const validate = require('../middleware/validateMiddleware');
const {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema
} = require('../validators/expenseValidators');
const {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { getExpenseMoveId } = require('../services/expenseService');
const { ROLES } = require('../constants/roles');

// Nested under /moves/:moveId/expenses
const moveExpenseRouter = express.Router({ mergeParams: true });
moveExpenseRouter.use(authenticate);

moveExpenseRouter
  .route('/')
  .get(checkMoveAccess(ROLES.VIEWER), validate(expenseQuerySchema, 'query'), getExpenses)
  .post(checkMoveAccess(ROLES.EDITOR), validate(createExpenseSchema), createExpense);

// Direct expense operations: /expenses/:expenseId
const directExpenseRouter = express.Router();
directExpenseRouter.use(authenticate);

directExpenseRouter
  .route('/:expenseId')
  .get(checkChildResourceAccess('expenseId', getExpenseMoveId, 'Expense', ROLES.VIEWER), getExpense)
  .patch(checkChildResourceAccess('expenseId', getExpenseMoveId, 'Expense', ROLES.EDITOR), validate(updateExpenseSchema), updateExpense)
  .delete(checkChildResourceAccess('expenseId', getExpenseMoveId, 'Expense', ROLES.EDITOR), deleteExpense);

module.exports = { moveExpenseRouter, directExpenseRouter };

