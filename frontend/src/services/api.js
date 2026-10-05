/**
 * Aura Enterprise Engine — Centralized API Client
 * Provides normalized HTTP communication, standardized error unwrapping,
 * and environment-configured base URL resolution.
 */

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
).replace(/\/+$/, '');

/**
 * Standard API error class encapsulating HTTP status and server error envelopes.
 */
export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Converts a query parameters object into a clean query string.
 *
 * @param {object} params
 * @returns {string}
 */
export function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  });
  const str = query.toString();
  return str ? `?${str}` : '';
}

/**
 * Reusable JSON fetch wrapper
 *
 * @param {string} endpoint - API route (e.g. '/health')
 * @param {RequestInit} [options={}] - Fetch configuration options
 * @returns {Promise<any>}
 */
export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    // Parse response body if present
    let responseData = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage =
        responseData?.error?.message ||
        responseData?.message ||
        `HTTP Error ${response.status}: ${response.statusText}`;

      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network failure, CORS blockage, or offline server
    throw new ApiError(
      error.message || 'Network request failed. Backend may be offline.',
      0,
      null
    );
  }
}

/**
 * Centralized API service interface
 */
export const api = {
  /**
   * Performs system health check
   * Calls GET /api/health
   */
  async getHealth() {
    return request('/health');
  },
  health: async () => request('/health'),

  /**
   * Inventory API methods
   */
  inventory: {
    /**
     * Retrieves paginated, filtered, sorted inventory
     * @param {object} params - { page, limit, search, category, stockStatus, minPrice, maxPrice, sortBy, sortOrder }
     */
    async list(params = {}) {
      const qs = buildQueryString(params);
      return request(`/inventory${qs}`);
    },

    /**
     * Creates a new product
     * @param {object} productData
     */
    async create(productData) {
      return request('/inventory', {
        method: 'POST',
        body: JSON.stringify(productData),
      });
    },

    /**
     * Updates an existing product by ID
     * @param {string} id
     * @param {object} updateData
     */
    async update(id, updateData) {
      return request(`/inventory/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },

    /**
     * Deletes an existing product by ID
     * @param {string} id
     */
    async delete(id) {
      return request(`/inventory/${id}`, {
        method: 'DELETE',
      });
    },

    /**
     * Returns full download URL for streaming CSV export
     * @param {object} params
     * @returns {string}
     */
    getExportUrl(params = {}) {
      const qs = buildQueryString(params);
      return `${API_BASE_URL}/inventory/export${qs}`;
    },
  },

  /**
   * Analytics API methods
   */
  analytics: {
    /**
     * Fetches complete catalog aggregate analytics
     */
    async get() {
      return request('/analytics');
    },
  },

  /**
   * RapidDispatch Live Ops Tickets API methods
   */
  tickets: {
    /**
     * Retrieves paginated, filtered tickets
     * @param {object} params - { page, limit, search, status, priority, sortBy, sortOrder }
     */
    async list(params = {}) {
      const qs = buildQueryString(params);
      return request(`/tickets${qs}`);
    },

    /**
     * Fetches single ticket by ID
     * @param {string} id
     */
    async get(id) {
      return request(`/tickets/${id}`);
    },

    /**
     * Creates a new support ticket
     * @param {object} ticketData
     */
    async create(ticketData) {
      return request('/tickets', {
        method: 'POST',
        body: JSON.stringify(ticketData),
      });
    },

    /**
     * Updates an existing ticket by ticketId
     * @param {string} id
     * @param {object} updateData
     */
    async update(id, updateData) {
      return request(`/tickets/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
    },

    /**
     * Retrieves active server-side locks
     */
    async getLocks() {
      return request('/tickets/locks');
    },
  },
};

export default api;
