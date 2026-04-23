import { fetchChatsByIdService } from '../services/chatService.js';
import { handleServiceError } from './handleServiceError.js';

export const fetchChats = async (req, res) => {
  try {
    const chats = await fetchChatsByIdService(req.params.id);
    return res.status(200).json(chats);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
