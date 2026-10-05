import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

// Initialize Express application
const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS Whitelist
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

// 3. Mount Stripe Webhooks with RAW body parsing BEFORE global express.json()
app.use('/api/webhooks', webhookRoutes);

// 4. Request Body Parsing
app.use(express.json());

// 5. Request Latency & Diagnostics Logger
app.use(requestLogger);

// 6. System Health Check Endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'UP',
  });
});

// 7. Application API Routes (Sprint 18 Catalog & Sprint 19 Live Ops)
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tickets', ticketRoutes);

// 8. VaultPay Financial Core API Routes (Sprint 20)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);

// 7. 404 Handler for Unmatched Routes
app.use(notFoundHandler);

// 7. Centralized Global Error Handler
app.use(errorHandler);

export default app;
