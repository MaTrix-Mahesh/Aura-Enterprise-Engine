import { errorResponse } from '../utils/apiResponse.js';

/**
 * Role-Based Access Control Middleware Generator.
 * Enforces that req.user.role matches one of the allowed roles.
 *
 * @param {...string} allowedRoles - E.g. 'ADMIN', 'CLIENT'
 */
export function requireRole(...allowedRoles) {
  const normalizedRoles = allowedRoles.map((r) => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required before role verification.',
        errorCode: 'UNAUTHORIZED_NO_USER_CONTEXT',
      });
    }

    const userRole = req.user.role.toUpperCase();

    if (!normalizedRoles.includes(userRole)) {
      return errorResponse(res, {
        statusCode: 403,
        message: `Forbidden: Access requires one of [${normalizedRoles.join(', ')}] role(s). Current role '${userRole}' is not permitted.`,
        errorCode: 'FORBIDDEN_INSUFFICIENT_PERMISSIONS',
        details: {
          requiredRoles: normalizedRoles,
          currentRole: userRole,
        },
      });
    }

    next();
  };
}

export default requireRole;
