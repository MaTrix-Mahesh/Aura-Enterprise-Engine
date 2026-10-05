import { Router } from 'express';
import { createCheckoutSession } from '../controllers/paymentController.js';
import { authenticateJWT } from '../middleware/auth.js';

const router = Router();

// Payment endpoints require authentication
router.use(authenticateJWT);

// Create checkout session (Client or Admin for specified invoice)
router.post('/create-checkout-session', createCheckoutSession);

export default router;
