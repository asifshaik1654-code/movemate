const { z } = require('zod');
const { BOX_STATUSES } = require('../constants/statuses');

const createBoxSchema = z.object({
  roomId: z
    .string({ required_error: 'Room ID is required' })
    .min(1, 'Room ID cannot be empty'),
  description: z.string().trim().optional().default(''),
  isFragile: z.boolean().optional().default(false),
  isPriority: z.boolean().optional().default(false)
});

const updateBoxSchema = z.object({
  roomId: z.string().optional(),
  description: z.string().trim().optional(),
  isFragile: z.boolean().optional(),
  isPriority: z.boolean().optional(),
  status: z.enum(BOX_STATUSES).optional()
});

const boxQuerySchema = z.object({
  roomId: z.string().optional(),
  status: z.enum(BOX_STATUSES).optional(),
  isFragile: z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  isPriority: z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50)
});

module.exports = { createBoxSchema, updateBoxSchema, boxQuerySchema };

