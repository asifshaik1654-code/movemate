const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const Move = require('../models/Move');
const { logActivity } = require('./activityService');
const ApiError = require('../utils/apiError');

/**
 * Get parent moveId for an expense (used by checkChildResourceAccess)
 */
const getExpenseMoveId = async (expenseId) => {
  const expense = await Expense.findById(expenseId).select('moveId');
  if (!expense) throw new ApiError(404, 'Expense not found');
  return expense.moveId;
};

/**
 * Create a new expense item
 */
const createExpense = async (moveId, userId, expenseData) => {
  const move = await Move.findById(moveId);
  if (!move) throw new ApiError(404, 'Moving plan not found');

  const expense = await Expense.create({
    moveId,
    userId,
    ...expenseData
  });

  await logActivity({
    moveId,
    userId,
    action: 'EXPENSE_CREATED',
    details: `Added expense "${expense.title}" in category "${expense.category}" ($${expense.estimatedCost})`,
    entityType: 'Expense',
    entityId: expense._id
  });

  return expense;
};

/**
 * Get all expenses for a move with financial metrics summary
 */
const getMoveExpenses = async (moveId, query = {}) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 100;
  const skip = (page - 1) * limit;

  const filter = { moveId };
  if (query.category) filter.category = query.category;
  if (query.isPaid !== undefined) filter.isPaid = query.isPaid;
  if (query.search) {
    filter.title = { $regex: query.search, $options: 'i' };
  }

  const [expenses, allMoveExpenses, total] = await Promise.all([
    Expense.find(filter).sort('-createdAt').skip(skip).limit(limit),
    Expense.find({ moveId }), // for complete move financial totals
    Expense.countDocuments(filter)
  ]);

  // Financial aggregates across all expenses for this move
  let totalEstimatedCost = 0;
  let totalActualCost = 0;
  let totalPaid = 0;
  let totalUnpaid = 0;
  const categoryBreakdown = {};

  allMoveExpenses.forEach((exp) => {
    totalEstimatedCost += exp.estimatedCost || 0;
    totalActualCost += exp.actualCost || 0;

    if (exp.isPaid) {
      totalPaid += exp.actualCost > 0 ? exp.actualCost : exp.estimatedCost;
    } else {
      totalUnpaid += exp.actualCost > 0 ? exp.actualCost : exp.estimatedCost;
    }

    if (!categoryBreakdown[exp.category]) {
      categoryBreakdown[exp.category] = { estimated: 0, actual: 0, count: 0 };
    }
    categoryBreakdown[exp.category].estimated += exp.estimatedCost || 0;
    categoryBreakdown[exp.category].actual += exp.actualCost || 0;
    categoryBreakdown[exp.category].count += 1;
  });

  const variance = totalActualCost - totalEstimatedCost;
  const isOverBudget = variance > 0;

  return {
    expenses,
    summary: {
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      totalActualCost: Math.round(totalActualCost * 100) / 100,
      variance: Math.round(variance * 100) / 100,
      isOverBudget,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalUnpaid: Math.round(totalUnpaid * 100) / 100,
      categoryBreakdown
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
 * Get single expense by ID
 */
const getExpenseById = async (expenseId) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, 'Invalid Expense ID format');
  }

  const expense = await Expense.findById(expenseId);
  if (!expense) throw new ApiError(404, 'Expense not found');
  return expense;
};

/**
 * Update an expense
 */
const updateExpense = async (expenseId, userId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, 'Invalid Expense ID format');
  }

  const expense = await Expense.findByIdAndUpdate(
    expenseId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!expense) throw new ApiError(404, 'Expense not found');

  await logActivity({
    moveId: expense.moveId,
    userId,
    action: 'EXPENSE_UPDATED',
    details: `Updated expense "${expense.title}" (actual: $${expense.actualCost}, paid: ${expense.isPaid})`,
    entityType: 'Expense',
    entityId: expense._id
  });

  return expense;
};

/**
 * Delete an expense
 */
const deleteExpense = async (expenseId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(expenseId)) {
    throw new ApiError(400, 'Invalid Expense ID format');
  }

  const expense = await Expense.findByIdAndDelete(expenseId);
  if (!expense) throw new ApiError(404, 'Expense not found');

  await logActivity({
    moveId: expense.moveId,
    userId,
    action: 'EXPENSE_DELETED',
    details: `Deleted expense "${expense.title}"`,
    entityType: 'Expense',
    entityId: expenseId
  });

  return { deleted: true, expenseId };
};

module.exports = {
  getExpenseMoveId,
  createExpense,
  getMoveExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense
};

