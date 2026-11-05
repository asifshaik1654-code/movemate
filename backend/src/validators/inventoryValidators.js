const { z } = require('zod');

const createItemSchema = z.object({
  name: z
    .string({ required_error: 'Item name is required' })
    .trim()
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name cannot exceed 100 characters'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').optional().default(1),
  isFragile: z.boolean().optional().default(false),
  isPacked: z.boolean().optional(),
  estimatedValue: z.coerce.number().min(0, 'Estimated value cannot be negative').optional().default(0),
  boxId: z.string().nullable().optional(),
  notes: z.string().trim().optional().default('')
});

const updateItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Item name must be at least 2 characters')
    .max(100, 'Item name cannot exceed 100 characters')
    .optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  isFragile: z.boolean().optional(),
  isPacked: z.boolean().optional(),
  estimatedValue: z.coerce.number().min(0).optional(),
  boxId: z.string().nullable().optional(),
  notes: z.string().trim().optional()
});

const itemQuerySchema = z.object({
  boxId: z.string().optional(),
  isPacked: z.string().optional().transform((v) => (v === undefined ? undefined : v === 'true')),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50)
});

module.exports = { createItemSchema, updateItemSchema, itemQuerySchema };

