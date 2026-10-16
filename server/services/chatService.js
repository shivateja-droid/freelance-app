import { Chat, Project } from '../Schema.js';

export const fetchChatsByIdService = async (chatId, user) => {
  const project = await Project.findById(chatId);
  const isParticipant = project && (
    user.usertype === 'admin'
    || project.client?.toString() === user._id.toString()
    || project.freelancer?.toString() === user._id.toString()
  );

  if (!isParticipant) {
    const error = new Error('You are not allowed to view this chat');
    error.status = 403;
    throw error;
  }

  return Chat.findOne({ project: project._id });
};
