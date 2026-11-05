const ApiError = require('../utils/apiError');

/**
 * Higher-order middleware to validate request payloads against a Zod schema.
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[source]);
      if (!result.success) {
        const formattedErrors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return next(new ApiError(400, 'Validation failed', formattedErrors));
      }
      // Replace with parsed/sanitized data (strips unknown fields)
      req[source] = result.data;
      next();
    } catch (err) {
      next(err);
    }
  };
};

module.exports = validate;
