import { Router } from 'express';
import {
  getInventory,
  createProduct,
  updateProduct,
  deleteProduct,
  exportInventory,
} from '../controllers/inventoryController.js';
import { validate } from '../middleware/validate.js';
import {
  inventoryQuerySchema,
  productBodySchema,
  updateProductBodySchema,
} from '../validators/inventoryValidator.js';

const router = Router();

// 1. Streaming CSV Export (must be registered before /:id)
router.get('/export', validate(inventoryQuerySchema, 'query'), exportInventory);

// 2. Paginated & Filtered Inventory List
router.get('/', validate(inventoryQuerySchema, 'query'), getInventory);

// 3. Create Product
router.post('/', validate(productBodySchema, 'body'), createProduct);

// 4. Update Product by ID
router.put('/:id', validate(updateProductBodySchema, 'body'), updateProduct);

// 5. Delete Product by ID
router.delete('/:id', deleteProduct);

export default router;
