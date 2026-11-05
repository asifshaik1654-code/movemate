const { z } = require('zod');
const { MOVE_STATUSES } = require('../constants/statuses');

const createMoveSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title cannot exceed 100 characters'),
  currentAddress: z
    .string({ required_error: 'Current address is required' })
    .trim()
    .min(3, 'Current address must be at least 3 characters long'),
  destinationAddress: z
    .string({ required_error: 'Destination address is required' })
    .trim()
    .min(3, 'Destination address must be at least 3 characters long'),
  moveDate: z
    .string({ required_error: 'Moving date is required' })
    .or(z.date())
    .pipe(z.coerce.date()),
  status: z.enum(MOVE_STATUSES).optional().default('Planning'),
  notes: z.string().trim().optional().default('')
});

const updateMoveSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title cannot exceed 100 characters')
    .optional(),
  currentAddress: z
    .string()
    .trim()
    .min(3, 'Current address must be at least 3 characters long')
    .optional(),
  destinationAddress: z
    .string()
    .trim()
    .min(3, 'Destination address must be at least 3 characters long')
    .optional(),
  moveDate: z.string().or(z.date()).pipe(z.coerce.date()).optional(),
  status: z.enum(MOVE_STATUSES).optional(),
  notes: z.string().trim().optional()
});

const moveQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z.enum(MOVE_STATUSES).optional(),
  sort: z.string().optional().default('-createdAt')
});

module.exports = {
  createMoveSchema,
  updateMoveSchema,
  moveQuerySchema
};

