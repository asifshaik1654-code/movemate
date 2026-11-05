const { z } = require('zod');
const { TASK_STATUSES, TASK_PRIORITIES } = require('../constants/statuses');

const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(150, 'Title cannot exceed 150 characters'),
  description: z.string().trim().optional().default(''),
  status: z.enum(TASK_STATUSES).optional().default('Pending'),
  priority: z.enum(TASK_PRIORITIES).optional().default('Medium'),
  dueDate: z.string().or(z.date()).pipe(z.coerce.date()).nullable().optional(),
  isEssential: z.boolean().optional().default(false),
  roomId: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional()
});

const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(150, 'Title cannot exceed 150 characters')
    .optional(),
  description: z.string().trim().optional(),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  dueDate: z.string().or(z.date()).pipe(z.coerce.date()).nullable().optional(),
  isEssential: z.boolean().optional(),
  roomId: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional()
});

const taskQuerySchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  isEssential: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  assignedTo: z.string().optional(),
  roomId: z.string().optional(),
  overdue: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  sort: z.string().optional().default('dueDate')
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  taskQuerySchema
};

