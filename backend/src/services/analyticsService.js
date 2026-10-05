import { Product } from '../models/Product.js';

/**
 * Computes catalog metrics via a single native MongoDB $facet aggregation pipeline.
 * Completely offloads computation to the database engine with zero Node.js heap impact.
 *
 * @returns {Promise<object>} Analytics payload
 */
export async function getCatalogAnalytics() {
  const [result] = await Product.aggregate([
    {
      $facet: {
        // 1. Overall Catalog Summary
        summary: [
          {
            $group: {
              _id: null,
              totalSKUs: { $sum: 1 },
              totalInventoryValue: {
                $sum: { $multiply: ['$cost', '$stockQuantity'] },
              },
              outOfStockCount: {
                $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] },
              },
              lowStockCount: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gt: ['$stockQuantity', 0] },
                        { $lte: ['$stockQuantity', '$reorderLevel'] },
                      ],
                    },
                    1,
                    0,
                  ],
                },
              },
              healthyStockCount: {
                $sum: {
                  $cond: [{ $gt: ['$stockQuantity', '$reorderLevel'] }, 1, 0],
                },
              },
            },
          },
        ],

        // 2. Top 10 Lowest Stock Products (Restock Priority)
        topLowestStock: [
          { $match: { stockQuantity: { $gte: 0 } } },
          { $sort: { stockQuantity: 1, reorderLevel: -1 } },
          { $limit: 10 },
          {
            $project: {
              _id: 1,
              sku: 1,
              productName: 1,
              category: 1,
              stockQuantity: 1,
              reorderLevel: 1,
              price: 1,
              cost: 1,
            },
          },
        ],

        // 3. Category Valuation Distribution
        categoryValuation: [
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              totalUnits: { $sum: '$stockQuantity' },
              valuation: {
                $sum: { $multiply: ['$cost', '$stockQuantity'] },
              },
            },
          },
          { $sort: { valuation: -1 } },
          {
            $project: {
              _id: 0,
              category: '$_id',
              count: 1,
              totalUnits: 1,
              valuation: { $round: ['$valuation', 2] },
            },
          },
        ],
      },
    },
  ]);

  const summaryData = result?.summary?.[0] || {
    totalSKUs: 0,
    totalInventoryValue: 0,
    outOfStockCount: 0,
    lowStockCount: 0,
    healthyStockCount: 0,
  };

  return {
    totalSKUs: summaryData.totalSKUs,
    totalInventoryValue: Math.round(summaryData.totalInventoryValue * 100) / 100,
    outOfStockCount: summaryData.outOfStockCount,
    lowStockCount: summaryData.lowStockCount,
    healthyStockCount: summaryData.healthyStockCount,
    topLowestStock: result?.topLowestStock || [],
    categoryValuation: result?.categoryValuation || [],
  };
}

export default {
  getCatalogAnalytics,
};
