import { Router } from 'express';
import { login, getMe } from '../controllers/authController.js';
import { authenticateJWT } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validators/authValidator.js';

const router = Router();

// Public authentication endpoint
router.post('/login', validate(loginSchema, 'body'), login);

// Authenticated current user profile
router.get('/me', authenticateJWT, getMe);

export default router;
