/**
 * Utility functions for standardizing API response envelopes across Aura Enterprise Engine.
 * Conforms to RULES.md and ARCHITECTURE.md specifications.
 */

/**
 * Sends a standardized success response envelope.
 *
 * @param {import('express').Response} res - Express response object
 * @param {Object} options
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {string} [options.message] - Optional human-readable message
 * @param {*} [options.data] - Payload data
 * @param {Object} [options.pagination] - Optional pagination metadata
 */
export function successResponse(res, { statusCode = 200, message, data, pagination } = {}) {
  const responseBody = {
    success: true,
  };

  if (message !== undefined) {
    responseBody.message = message;
  }

  if (data !== undefined) {
    responseBody.data = data;
  }

  if (pagination !== undefined) {
    responseBody.pagination = pagination;
  }

  return res.status(statusCode).json(responseBody);
}

/**
 * Sends a standardized error response envelope.
 *
 * @param {import('express').Response} res - Express response object
 * @param {Object} options
 * @param {number} [options.statusCode=500] - HTTP status code
 * @param {string} [options.message='Internal Server Error'] - Human-readable error message
 * @param {string} [options.errorCode='INTERNAL_SERVER_ERROR'] - Machine-readable error code
 * @param {Array<Object>|Object|null} [options.details=null] - Optional detailed validation or context errors
 */
export function errorResponse(res, {
  statusCode = 500,
  message = 'Internal Server Error',
  errorCode = 'INTERNAL_SERVER_ERROR',
  details = null,
} = {}) {
  const responseBody = {
    success: false,
    message,
    errorCode,
  };

  if (details !== null && details !== undefined) {
    responseBody.details = details;
  }

  return res.status(statusCode).json(responseBody);
}

export default {
  successResponse,
  errorResponse,
};
