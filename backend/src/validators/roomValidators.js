const { z } = require('zod');

const createRoomSchema = z.object({
  name: z
    .string({ required_error: 'Room name is required' })
    .trim()
    .min(2, 'Room name must be at least 2 characters')
    .max(50, 'Room name cannot exceed 50 characters'),
  floor: z.string().trim().optional().default(''),
  colorCode: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'colorCode must be a valid hex color (e.g. #3B82F6)')
    .optional()
    .default('#3B82F6')
});

const updateRoomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Room name must be at least 2 characters')
    .max(50, 'Room name cannot exceed 50 characters')
    .optional(),
  floor: z.string().trim().optional(),
  colorCode: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'colorCode must be a valid hex color (e.g. #3B82F6)')
    .optional()
});

module.exports = { createRoomSchema, updateRoomSchema };

