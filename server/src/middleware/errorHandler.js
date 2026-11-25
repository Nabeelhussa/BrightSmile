import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Malformed JSON payload from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'Malformed JSON request body',
      },
    });
  }

  // PostgreSQL / SQLite unique violation
  const errCode = err?.code || '';
  const errMsg = err?.message || '';
  if (
    errCode === '23505' ||
    errCode === 'ERR_SQLITE_ERROR' && errMsg.includes('UNIQUE constraint failed')
  ) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RECORD',
        message: 'A record with this unique value already exists.',
      },
    });
  }

  // Foreign key violation
  if (
    errCode === '23503' ||
    (errCode === 'ERR_SQLITE_ERROR' && errMsg.includes('FOREIGN KEY constraint failed'))
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced doctor record does not exist.',
      },
    });
  }

  if (env.nodeEnv !== 'test') {
    console.error('Unhandled API Error:', err);
  }

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        env.nodeEnv === 'production'
          ? 'An unexpected server error occurred.'
          : errMsg || 'An unexpected server error occurred.',
    },
  });
}
