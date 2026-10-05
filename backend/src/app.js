import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';

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

// 3. Request Body Parsing
app.use(express.json());

// 4. Request Latency & Diagnostics Logger
app.use(requestLogger);

// 5. System Health Check Endpoint
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'UP',
  });
});

// 6. Application API Routes
app.use('/api/inventory', inventoryRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/tickets', ticketRoutes);

// 7. 404 Handler for Unmatched Routes
app.use(notFoundHandler);

// 7. Centralized Global Error Handler
app.use(errorHandler);

export default app;
