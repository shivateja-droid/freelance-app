import express from 'express';
import {
  fetchFreelancer,
  updateFreelancer,
} from '../controllers/freelancerController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { schemas } from '../validation/schemas.js';

const router = express.Router();

router.get('/fetch-freelancer/:id', requireAuth, requireRole('freelancer', 'admin'), validate(schemas.idParam, 'params'), fetchFreelancer);
router.post('/update-freelancer', requireAuth, requireRole('freelancer'), validate(schemas.updateFreelancer), updateFreelancer);

export default router;
