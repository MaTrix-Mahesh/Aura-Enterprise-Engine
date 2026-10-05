import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import { User } from '../models/User.js';

/**
 * Authentication Middleware: Verifies Bearer JWT on protected routes.
 * Populates req.user with authoritative user identity.
 */
export async function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || typeof authHeader !== 'string') {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Authentication required. Authorization header missing.',
        errorCode: 'UNAUTHORIZED_MISSING_TOKEN',
      });
    }

    const parts = authHeader.trim().split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid authorization format. Expected format: Bearer <token>',
        errorCode: 'UNAUTHORIZED_INVALID_HEADER_FORMAT',
      });
    }

    const token = parts[1];

    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return errorResponse(res, {
          statusCode: 401,
          message: 'Authentication token has expired. Please log in again.',
          errorCode: 'UNAUTHORIZED_TOKEN_EXPIRED',
        });
      }
      return errorResponse(res, {
        statusCode: 401,
        message: 'Invalid authentication token.',
        errorCode: 'UNAUTHORIZED_INVALID_TOKEN',
      });
    }

    if (!decoded || !decoded.userId) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'Malformed token payload: missing user identity.',
        errorCode: 'UNAUTHORIZED_MALFORMED_TOKEN',
      });
    }

    // Verify user still exists in database and is active
    const user = await User.findById(decoded.userId).lean();
    if (!user || user.isActive === false) {
      return errorResponse(res, {
        statusCode: 401,
        message: 'User account not found or has been deactivated.',
        errorCode: 'UNAUTHORIZED_USER_INACTIVE',
      });
    }

    // Attach authoritative identity to req.user
    req.user = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
    };

    next();
  } catch (error) {
    next(error);
  }
}

export default authenticateJWT;
