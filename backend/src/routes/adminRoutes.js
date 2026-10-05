import { Router } from 'express';
import { createClient, listClients } from '../controllers/authController.js';
import { getAdminStats } from '../controllers/invoiceController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema } from '../validators/authValidator.js';

const router = Router();

// Strict RBAC: All admin routes require ADMIN role
router.use(authenticateJWT);
router.use(requireRole('ADMIN'));

// Client Management
router.post('/clients', validate(createClientSchema, 'body'), createClient);
router.get('/clients', listClients);

// Financial Overview KPIs
router.get('/stats', getAdminStats);

export default router;
