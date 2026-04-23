import express from 'express';
import {
  approveApplication,
  createBid,
  fetchApplications,
  rejectApplication,
} from '../controllers/applicationController.js';

const router = express.Router();

router.post('/make-bid', createBid);
router.get('/fetch-applications', fetchApplications);
router.get('/approve-application/:id', approveApplication);
router.get('/reject-application/:id', rejectApplication);

export default router;
