import express from 'express';
import {
  approveApplication,
  createBid,
  fetchApplications,
  rejectApplication,
} from '../controllers/applicationController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { schemas } from '../validation/schemas.js';

const router = express.Router();

router.post('/make-bid', requireAuth, requireRole('freelancer'), validate(schemas.createBid), createBid);
router.get('/fetch-applications', requireAuth, fetchApplications);
router.get('/approve-application/:id', requireAuth, requireRole('client'), validate(schemas.idParam, 'params'), approveApplication);
router.get('/reject-application/:id', requireAuth, requireRole('client'), validate(schemas.idParam, 'params'), rejectApplication);

export default router;
