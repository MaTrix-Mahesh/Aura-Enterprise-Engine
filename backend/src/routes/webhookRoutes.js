import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook } from '../controllers/webhookController.js';

const router = Router();

// Public Stripe Webhook Endpoint: Receives RAW buffer for signature verification
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router;
