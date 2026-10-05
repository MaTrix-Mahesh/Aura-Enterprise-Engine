import { Router } from 'express';
import {
  listInvoices,
  getInvoice,
  createInvoice,
  downloadInvoicePdf,
} from '../controllers/invoiceController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import {
  createInvoiceSchema,
  invoiceQuerySchema,
} from '../validators/invoiceValidator.js';

const router = Router();

// Zero-Trust: Every protected invoice route requires a verified JWT
router.use(authenticateJWT);

// List invoices (Admin sees all; Client sees only their own)
router.get('/', validate(invoiceQuerySchema, 'query'), listInvoices);

// Create invoice (Admin only)
router.post('/', requireRole('ADMIN'), validate(createInvoiceSchema, 'body'), createInvoice);

// Download PDF (Authorized: Admin or owning Client)
router.get('/:id/pdf', downloadInvoicePdf);

// Get single invoice by ID (IDOR protected: Admin or owning Client)
router.get('/:id', getInvoice);

export default router;
