import express from 'express';
import { fetchChats } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validateRequest.js';
import { schemas } from '../validation/schemas.js';

const router = express.Router();

router.get('/fetch-chats/:id', requireAuth, validate(schemas.idParam, 'params'), fetchChats);

export default router;
