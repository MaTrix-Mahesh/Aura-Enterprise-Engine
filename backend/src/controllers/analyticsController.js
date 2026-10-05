import analyticsService from '../services/analyticsService.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Controller to fetch comprehensive real-time catalog analytics.
 */
export async function getAnalytics(req, res, next) {
  try {
    const analytics = await analyticsService.getCatalogAnalytics();
    return successResponse(res, {
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAnalytics,
};
