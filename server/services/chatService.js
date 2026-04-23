import { Chat } from '../Schema.js';

export const fetchChatsByIdService = async (chatId) => {
  return Chat.findById(chatId);
};
