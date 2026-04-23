import express from 'express';
import { fetchChats } from '../controllers/chatController.js';

const router = express.Router();

router.get('/fetch-chats/:id', fetchChats);

export default router;
