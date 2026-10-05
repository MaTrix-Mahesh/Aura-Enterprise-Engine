import { Router } from 'express';
import {
  getClientInvoices,
  getClientInvoice,
  getClientStats,
} from '../controllers/invoiceController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { invoiceQuerySchema } from '../validators/invoiceValidator.js';

const router = Router();

// Strict RBAC: All client routes require CLIENT role
router.use(authenticateJWT);
router.use(requireRole('CLIENT'));

// Client Billing & Invoices
router.get('/invoices', validate(invoiceQuerySchema, 'query'), getClientInvoices);
router.get('/invoices/:id', getClientInvoice);
router.get('/stats', getClientStats);

export default router;
