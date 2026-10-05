import { errorResponse } from '../utils/apiResponse.js';

/**
 * Express middleware generator to validate request parts using Zod schemas.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} [target='body']
 */
export function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errorDetails = issues.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      return errorResponse(res, {
        statusCode: 400,
        message: issues[0]?.message || 'Validation Error',
        errorCode: 'VALIDATION_ERROR',
        details: errorDetails,
      });
    }

    // Assign sanitized & coerced data back to req safely in Express 5
    if (target === 'query') {
      try {
        req.query = result.data;
      } catch {
        // req.query is getter-only in Express 5
        Object.assign(req.query, result.data);
      }
    } else {
      req[target] = result.data;
    }
    next();
  };
}

export default validate;
