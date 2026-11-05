const expenseService = require('../services/expenseService');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/v1/moves/:moveId/expenses
 */
const createExpense = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const expense = await expenseService.createExpense(moveId, req.user._id, req.body);

  return new ApiResponse(201, 'Expense created successfully', expense).send(res);
});

/**
 * GET /api/v1/moves/:moveId/expenses
 */
const getExpenses = asyncHandler(async (req, res) => {
  const { moveId } = req.params;
  const result = await expenseService.getMoveExpenses(moveId, req.query);

  return new ApiResponse(200, 'Expenses retrieved successfully', result).send(res);
});

/**
 * GET /api/v1/expenses/:expenseId
 */
const getExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const expense = await expenseService.getExpenseById(expenseId);

  return new ApiResponse(200, 'Expense details retrieved successfully', expense).send(res);
});

/**
 * PATCH /api/v1/expenses/:expenseId
 */
const updateExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const expense = await expenseService.updateExpense(expenseId, req.user._id, req.body);

  return new ApiResponse(200, 'Expense updated successfully', expense).send(res);
});

/**
 * DELETE /api/v1/expenses/:expenseId
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const { expenseId } = req.params;
  const result = await expenseService.deleteExpense(expenseId, req.user._id);

  return new ApiResponse(200, 'Expense deleted successfully', result).send(res);
});

module.exports = {
  createExpense,
  getExpenses,
  getExpense,
  updateExpense,
  deleteExpense
};

