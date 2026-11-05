const ApiError = require('../utils/apiError');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));
    error = new ApiError(400, 'Validation Error', formattedErrors);
  }

  // Handle Mongoose bad ObjectId (CastError)
  else if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ApiError(404, message);
  }

  // Handle Mongoose duplicate key error (code 11000)
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    const message = `Duplicate value entered for ${field}. Please use another value.`;
    error = new ApiError(409, message, [{ field, message }]);
  }

  // Handle Mongoose validation error
  else if (err.name === 'ValidationError') {
    const formattedErrors = Object.values(err.errors || {}).map((val) => ({
      field: val.path,
      message: val.message
    }));
    error = new ApiError(400, 'Schema Validation Failed', formattedErrors);
  }

  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid authentication token');
  } else if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Authentication token has expired. Please log in again.');
  }

  // If not already an ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    errors: error.errors && error.errors.length > 0 ? error.errors : undefined
  };

  // Only include stack trace in non-production environments
  if (env.NODE_ENV !== 'production' && error.stack) {
    response.stack = error.stack;
  }

  res.status(error.statusCode).json(response);
};

module.exports = errorHandler;

