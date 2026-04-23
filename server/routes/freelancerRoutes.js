import express from 'express';
import {
  fetchFreelancer,
  updateFreelancer,
} from '../controllers/freelancerController.js';

const router = express.Router();

router.get('/fetch-freelancer/:id', fetchFreelancer);
router.post('/update-freelancer', updateFreelancer);

export default router;
