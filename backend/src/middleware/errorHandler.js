import { env } from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * 404 handler for all unmatched routes.
 */
export function notFoundHandler(req, res) {
  const method = req.method;
  const path = req.originalUrl || req.url;
  return errorResponse(res, {
    statusCode: 404,
    message: `Resource not found: ${method} ${path}`,
    errorCode: 'NOT_FOUND',
  });
}

/**
 * Global centralized error-handling middleware.
 * Guarantees standard error format and prevents information leakage in production.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
    ? err.statusCode
    : 500;

  const errorCode = err.errorCode || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');
  const message = err.message || 'An unexpected internal error occurred';
  const details = err.details || null;

  // Log error on server for diagnostics
  if (statusCode === 500) {
    console.error(`[Server Exception] ${err.name || 'Error'}: ${err.message}`);
    if (env.NODE_ENV !== 'production' && err.stack) {
      console.error(err.stack);
    }
  }

  return errorResponse(res, {
    statusCode,
    message,
    errorCode,
    details,
  });
}

export default {
  notFoundHandler,
  errorHandler,
};
