const { z } = require('zod');
const { SERVICE_TYPES, SERVICE_STATUSES } = require('../constants/statuses');

/**
 * Validation schema for creating a service booking
 */
const createBookingSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES, {
    errorMap: () => ({ message: `Service type must be one of: ${SERVICE_TYPES.join(', ')}` })
  }),
  providerName: z
    .string({ required_error: 'Provider name is required' })
    .trim()
    .min(2, 'Provider name must be at least 2 characters long')
    .max(100, 'Provider name cannot exceed 100 characters'),
  contactPhone: z.string().trim().optional().default(''),
  scheduledDate: z
    .string({ required_error: 'Scheduled date is required' })
    .datetime({ message: 'Scheduled date must be a valid ISO-8601 datetime' }),
  status: z.enum(SERVICE_STATUSES).optional().default('Booked'),
  confirmationNumber: z.string().trim().optional().default(''),
  cost: z.number().min(0, 'Cost cannot be negative').optional().default(0),
  notes: z.string().trim().optional().default('')
});

/**
 * Validation schema for updating a service booking
 */
const updateBookingSchema = z.object({
  serviceType: z.enum(SERVICE_TYPES).optional(),
  providerName: z
    .string()
    .trim()
    .min(2, 'Provider name must be at least 2 characters long')
    .max(100, 'Provider name cannot exceed 100 characters')
    .optional(),
  contactPhone: z.string().trim().optional(),
  scheduledDate: z.string().datetime({ message: 'Scheduled date must be a valid ISO-8601 datetime' }).optional(),
  status: z.enum(SERVICE_STATUSES).optional(),
  confirmationNumber: z.string().trim().optional(),
  cost: z.number().min(0, 'Cost cannot be negative').optional(),
  notes: z.string().trim().optional()
});

/**
 * Validation schema for querying service bookings
 */
const bookingQuerySchema = z.object({
  serviceType: z.enum(SERVICE_TYPES).optional(),
  status: z.enum(SERVICE_STATUSES).optional(),
  search: z.string().trim().optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  bookingQuerySchema
};

