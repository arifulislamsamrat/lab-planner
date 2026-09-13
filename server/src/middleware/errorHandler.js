const ApiError = require('../utils/ApiError');

function errorHandler(err, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { message: err.message, details: err.details },
    });
  }

  if (err && err.name === 'ValidationError') {
    return res.status(400).json({
      error: { message: 'Validation failed', details: err.errors },
    });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({
      error: { message: `Invalid ${err.path}: ${err.value}` },
    });
  }

  return res.status(500).json({
    error: { message: 'Internal server error' },
  });
}

module.exports = errorHandler;