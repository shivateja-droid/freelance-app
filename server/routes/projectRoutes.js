import express from 'express';
import {
  approveSubmission,
  createProject,
  fetchProject,
  fetchProjects,
  rejectSubmission,
  submitProject,
} from '../controllers/projectController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { schemas } from '../validation/schemas.js';

const router = express.Router();

router.get('/fetch-project/:id', requireAuth, validate(schemas.idParam, 'params'), fetchProject);
router.get('/fetch-projects', requireAuth, fetchProjects);
router.post('/new-project', requireAuth, requireRole('client'), validate(schemas.createProject), createProject);
router.post('/submit-project', requireAuth, requireRole('freelancer'), validate(schemas.submitProject), submitProject);
router.get('/approve-submission/:id', requireAuth, requireRole('client'), validate(schemas.idParam, 'params'), approveSubmission);
router.get('/reject-submission/:id', requireAuth, requireRole('client'), validate(schemas.idParam, 'params'), rejectSubmission);

export default router;
