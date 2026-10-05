import { z } from 'zod';

export const productBodySchema = z
  .object({
    productName: z.string({ required_error: 'productName is required' }).trim().min(1, 'productName cannot be empty'),
    sku: z.string({ required_error: 'sku is required' }).trim().min(1, 'sku cannot be empty'),
    category: z.string({ required_error: 'category is required' }).trim().min(1, 'category cannot be empty'),
    price: z.number({ required_error: 'price is required' }).min(0, 'price cannot be negative'),
    cost: z.number({ required_error: 'cost is required' }).min(0, 'cost cannot be negative'),
    stockQuantity: z.number({ required_error: 'stockQuantity is required' }).int().min(0, 'stockQuantity cannot be negative'),
    reorderLevel: z.number({ required_error: 'reorderLevel is required' }).int().min(0, 'reorderLevel cannot be negative'),
  })
  .refine((data) => data.price >= data.cost, {
    message: 'Price cannot be lower than cost',
    path: ['price'],
  });

export const updateProductBodySchema = z
  .object({
    productName: z.string().trim().min(1).optional(),
    sku: z.string().trim().min(1).optional(),
    category: z.string().trim().min(1).optional(),
    price: z.number().min(0).optional(),
    cost: z.number().min(0).optional(),
    stockQuantity: z.number().int().min(0).optional(),
    reorderLevel: z.number().int().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.price !== undefined && data.cost !== undefined) {
        return data.price >= data.cost;
      }
      return true;
    },
    {
      message: 'Price cannot be lower than cost',
      path: ['price'],
    }
  );

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  search: z.string().optional(),
  category: z.string().optional(),
  stockStatus: z.enum(['all', 'in_stock', 'low_stock', 'out_of_stock']).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z.string().optional().default('lastUpdated'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});
