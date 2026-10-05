import { Router } from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();

// GET /api/analytics
router.get('/', getAnalytics);

export default router;
