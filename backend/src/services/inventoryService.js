import { Product } from '../models/Product.js';

/**
 * Builds a sanitized MongoDB query filter from input parameters.
 *
 * @param {object} params
 * @returns {object} Mongo query filter
 */
export function buildInventoryFilter(params = {}) {
  const filter = {};

  // 1. Text / SKU search
  if (params.search && typeof params.search === 'string') {
    const trimmed = params.search.trim();
    if (trimmed) {
      // Escape regex special chars to prevent injection
      const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { sku: { $regex: `^${escaped}`, $options: 'i' } },
        { productName: { $regex: escaped, $options: 'i' } },
      ];
    }
  }

  // 2. Category Filter
  if (params.category && typeof params.category === 'string' && params.category !== 'All' && params.category !== '') {
    filter.category = params.category.trim();
  }

  // 3. Stock Level Filter
  if (params.stockStatus) {
    const status = params.stockStatus.toLowerCase();
    if (status === 'out_of_stock') {
      filter.stockQuantity = 0;
    } else if (status === 'low_stock') {
      filter.stockQuantity = { $gt: 0 };
      filter.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
    } else if (status === 'in_stock') {
      filter.$expr = { $gt: ['$stockQuantity', '$reorderLevel'] };
    }
  }

  // 4. Price Range Filter
  if (params.minPrice !== undefined && params.minPrice !== null && !isNaN(Number(params.minPrice))) {
    filter.price = { ...(filter.price || {}), $gte: Number(params.minPrice) };
  }
  if (params.maxPrice !== undefined && params.maxPrice !== null && !isNaN(Number(params.maxPrice))) {
    filter.price = { ...(filter.price || {}), $lte: Number(params.maxPrice) };
  }

  return filter;
}

/**
 * Builds sort specification from input parameters.
 *
 * @param {string} sortBy
 * @param {string} sortOrder
 * @returns {object} Mongo sort object
 */
export function buildSortSpec(sortBy = 'lastUpdated', sortOrder = 'desc') {
  const allowedSortFields = [
    'productName',
    'sku',
    'category',
    'price',
    'cost',
    'stockQuantity',
    'reorderLevel',
    'lastUpdated',
  ];

  const field = allowedSortFields.includes(sortBy) ? sortBy : 'lastUpdated';
  const direction = String(sortOrder).toLowerCase() === 'asc' ? 1 : -1;

  return { [field]: direction };
}

/**
 * Retrieves paginated, filtered inventory documents.
 *
 * @param {object} params
 * @returns {Promise<{ items: Array, pagination: object }>}
 */
export async function getInventory(params = {}) {
  const page = Math.max(1, parseInt(params.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 50));
  const skip = (page - 1) * limit;

  const filter = buildInventoryFilter(params);
  const sort = buildSortSpec(params.sortBy, params.sortOrder);

  // Execute data query and total count concurrently
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Creates a new product document.
 *
 * @param {object} productData
 * @returns {Promise<Product>}
 */
export async function createProduct(productData) {
  const product = new Product(productData);
  return product.save();
}

/**
 * Updates an existing product document by ID.
 *
 * @param {string} id
 * @param {object} updateData
 * @returns {Promise<Product|null>}
 */
export async function updateProduct(id, updateData) {
  return Product.findByIdAndUpdate(
    id,
    { $set: updateData },
    { returnDocument: 'after', runValidators: true }
  );
}

/**
 * Deletes an existing product document by ID.
 *
 * @param {string} id
 * @returns {Promise<Product|null>}
 */
export async function deleteProduct(id) {
  return Product.findByIdAndDelete(id);
}

/**
 * Returns a lean cursor for streaming CSV exports.
 *
 * @param {object} params
 * @returns {import('mongoose').QueryCursor}
 */
export function getInventoryCursor(params = {}) {
  const filter = buildInventoryFilter(params);
  const sort = buildSortSpec(params.sortBy, params.sortOrder);
  return Product.find(filter).sort(sort).lean().cursor();
}

export default {
  getInventory,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventoryCursor,
};
