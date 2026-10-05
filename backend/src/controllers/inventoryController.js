import inventoryService from '../services/inventoryService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

/**
 * Controller to list paginated and filtered inventory.
 */
export async function getInventory(req, res, next) {
  try {
    const result = await inventoryService.getInventory(req.query);
    return successResponse(res, {
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to create a new product document.
 */
export async function createProduct(req, res, next) {
  try {
    const product = await inventoryService.createProduct(req.body);
    return successResponse(res, {
      statusCode: 201,
      message: 'Product created successfully',
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, {
        statusCode: 409,
        message: `Product with SKU '${req.body.sku}' already exists`,
        errorCode: 'DUPLICATE_SKU',
      });
    }
    next(error);
  }
}

/**
 * Controller to update an existing product by ID.
 */
export async function updateProduct(req, res, next) {
  try {
    const product = await inventoryService.updateProduct(req.params.id, req.body);
    if (!product) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Product with ID '${req.params.id}' not found`,
        errorCode: 'PRODUCT_NOT_FOUND',
      });
    }
    return successResponse(res, {
      statusCode: 200,
      message: 'Product updated successfully',
      data: product,
    });
  } catch (error) {
    if (error.code === 11000) {
      return errorResponse(res, {
        statusCode: 409,
        message: `Product with SKU '${req.body.sku}' already exists`,
        errorCode: 'DUPLICATE_SKU',
      });
    }
    next(error);
  }
}

/**
 * Controller to delete a product by ID.
 */
export async function deleteProduct(req, res, next) {
  try {
    const product = await inventoryService.deleteProduct(req.params.id);
    if (!product) {
      return errorResponse(res, {
        statusCode: 404,
        message: `Product with ID '${req.params.id}' not found`,
        errorCode: 'PRODUCT_NOT_FOUND',
      });
    }
    return successResponse(res, {
      statusCode: 200,
      message: 'Product deleted successfully',
      data: product,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to stream inventory CSV export via database cursor.
 */
export async function exportInventory(req, res, next) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="aura_inventory_export_${timestamp}.csv"`
    );

    // CSV Column Headers
    res.write('SKU,Product Name,Category,Price,Cost,Stock Quantity,Reorder Level,Last Updated\n');

    const cursor = inventoryService.getInventoryCursor(req.query);

    for await (const doc of cursor) {
      const sanitizedName = (doc.productName || '').replace(/"/g, '""');
      const sanitizedCategory = (doc.category || '').replace(/"/g, '""');
      const updatedStr = doc.lastUpdated ? new Date(doc.lastUpdated).toISOString() : '';

      const line = `"${doc.sku}","${sanitizedName}","${sanitizedCategory}",${doc.price},${doc.cost},${doc.stockQuantity},${doc.reorderLevel},"${updatedStr}"\n`;
      
      const canContinue = res.write(line);
      if (!canContinue) {
        // Wait for drain if buffer is full
        await new Promise((resolve) => res.once('drain', resolve));
      }
    }

    res.end();
  } catch (error) {
    next(error);
  }
}

export default {
  getInventory,
  createProduct,
  updateProduct,
  deleteProduct,
  exportInventory,
};
