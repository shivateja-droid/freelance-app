import express from 'express';
import {
  approveSubmission,
  createProject,
  fetchProject,
  fetchProjects,
  rejectSubmission,
  submitProject,
} from '../controllers/projectController.js';

const router = express.Router();

router.get('/fetch-project/:id', fetchProject);
router.get('/fetch-projects', fetchProjects);
router.post('/new-project', createProject);
router.post('/submit-project', submitProject);
router.get('/approve-submission/:id', approveSubmission);
router.get('/reject-submission/:id', rejectSubmission);

export default router;
