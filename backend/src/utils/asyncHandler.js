/**
 * Wraps async Express route handlers to automatically catch rejections
 * and forward them to the next() error handler.
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

module.exports = asyncHandler;

