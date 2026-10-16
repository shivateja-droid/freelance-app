import express from 'express';
import { fetchUsers } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/fetch-users', requireAuth, requireRole('admin'), fetchUsers);

export default router;
