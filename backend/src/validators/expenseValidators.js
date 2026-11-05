const { z } = require('zod');
const { EXPENSE_CATEGORIES } = require('../constants/statuses');

/**
 * Validation schema for creating an expense
 */
const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: `Category must be one of: ${EXPENSE_CATEGORIES.join(', ')}` })
  }),
  title: z
    .string({ required_error: 'Expense title is required' })
    .trim()
    .min(2, 'Expense title must be at least 2 characters long')
    .max(100, 'Expense title cannot exceed 100 characters'),
  estimatedCost: z
    .number({ required_error: 'Estimated cost is required' })
    .min(0, 'Estimated cost cannot be negative'),
  actualCost: z
    .number()
    .min(0, 'Actual cost cannot be negative')
    .optional()
    .default(0),
  isPaid: z.boolean().optional().default(false),
  receiptUrl: z.string().trim().optional().default('')
});

/**
 * Validation schema for updating an expense
 */
const updateExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  title: z
    .string()
    .trim()
    .min(2, 'Expense title must be at least 2 characters long')
    .max(100, 'Expense title cannot exceed 100 characters')
    .optional(),
  estimatedCost: z.number().min(0, 'Estimated cost cannot be negative').optional(),
  actualCost: z.number().min(0, 'Actual cost cannot be negative').optional(),
  isPaid: z.boolean().optional(),
  receiptUrl: z.string().trim().optional()
});

/**
 * Validation schema for querying expenses
 */
const expenseQuerySchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  isPaid: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  search: z.string().trim().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

module.exports = {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema
};

