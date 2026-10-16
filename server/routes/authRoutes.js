import express from 'express';
import { getCurrentUser, loginUser, registerUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { schemas } from '../validation/schemas.js';

const router = express.Router();

router.post('/register', validate(schemas.register), registerUser);
router.post('/login', validate(schemas.login), loginUser);
router.get('/me', requireAuth, getCurrentUser);

export default router;
