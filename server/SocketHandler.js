import { Chat, Project } from "./Schema.js";
import { v4 as uuid } from 'uuid';
import { validateSocketPayload } from './middleware/validateRequest.js';
import { schemas } from './validation/schemas.js';
import { logger } from './observability/logger.js';
import {
  CHAT_HISTORY_LIMIT,
  createMessageRateLimiter,
} from './config/chat.js';

const messageRateLimiter = createMessageRateLimiter();

const socketValidationError = (socket, result) => {
  socket.emit('request-error', {
    error: 'Invalid request data',
    details: result.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })),
  });
};

const ensureChatExists = async (projectId) => {
  return Chat.findOneAndUpdate(
    { project: projectId },
    {
      $push: { messages: { $each: [], $slice: -CHAT_HISTORY_LIMIT } },
      $setOnInsert: {
        _id: uuid(),
        project: projectId,
      },
    },
    {
      new: true,
      upsert: true,
    },
  );
};

const socketRateLimitError = (socket) => {
  socket.emit('request-error', {
    error: 'Too many messages',
    details: [{ field: 'message', message: 'Please slow down and try again later' }],
  });
};

const getParticipantProject = async (projectId, user) => {
  const project = await Project.findById(projectId);
  const isParticipant = project && (
    user.usertype === 'admin'
    || project.client?.toString() === user._id.toString()
    || project.freelancer?.toString() === user._id.toString()
  );

  return isParticipant ? project : null;
};

const logSocketAuthorizationDenied = (socket, eventName, projectId) => {
  logger.warn({ event: 'socket_authorization_denied', eventName, projectId, socketId: socket.id }, 'Socket authorization denied');
};

const logSocketError = (socket, eventName, error, projectId) => {
  logger.error({ err: error, event: 'socket_handler_failed', eventName, projectId, socketId: socket.id }, 'Socket handler failed');
};

const SocketHandler = (socket) => {
  socket.on("join-chat-room", async (payload = {}) => {
    try {
      const validation = validateSocketPayload(schemas.chatProject, payload);
      if (!validation.success) return socketValidationError(socket, validation);
      const { projectId } = validation.data;
      const project = await Project.findById(projectId);

      if (!project || socket.user.usertype !== 'freelancer' || project.freelancer?.toString() !== socket.user._id.toString()) {
        logSocketAuthorizationDenied(socket, 'join-chat-room', projectId);
        return;
      }

      await socket.join(projectId);

      socket.broadcast.to(projectId).emit("user-joined-room");

      const chat = await ensureChatExists(projectId);
      socket.emit('messages-updated', { chat });
    } catch (error) {
      logSocketError(socket, 'join-chat-room', error);
    }
  });

  socket.on("join-chat-room-client", async (payload = {}) => {
    try {
      const validation = validateSocketPayload(schemas.chatProject, payload);
      if (!validation.success) return socketValidationError(socket, validation);
      const { projectId } = validation.data;
      const project = await Project.findById(projectId);

      if (!project || socket.user.usertype !== 'client' || project.client?.toString() !== socket.user._id.toString() || (project.status !== "Assigned" && project.status !== "Completed")) {
        logSocketAuthorizationDenied(socket, 'join-chat-room-client', projectId);
        return;
      }

      await socket.join(projectId);

      socket.broadcast.to(projectId).emit("user-joined-room");

      const chat = await ensureChatExists(projectId);
      socket.emit('messages-updated', { chat });
    } catch (error) {
      logSocketError(socket, 'join-chat-room-client', error);
    }
  });

  socket.on('update-messages', async (payload = {}) => {
    try {
      const validation = validateSocketPayload(schemas.chatProject, payload);
      if (!validation.success) return socketValidationError(socket, validation);
      const { projectId } = validation.data;
      if (!await getParticipantProject(projectId, socket.user)) {
        logSocketAuthorizationDenied(socket, 'update-messages', projectId);
        return;
      }

      const chat = await ensureChatExists(projectId);
      socket.emit('messages-updated', { chat });
    } catch (error) {
      logSocketError(socket, 'update-messages', error);
    }
  });

  socket.on('new-message', async (payload = {}) => {
    try {
      const validation = validateSocketPayload(schemas.chatMessage, payload);
      if (!validation.success) return socketValidationError(socket, validation);
      const { projectId, message } = validation.data;
      if (!await getParticipantProject(projectId, socket.user)) {
        logSocketAuthorizationDenied(socket, 'new-message', projectId);
        return;
      }
      if (!messageRateLimiter.consume(socket.user._id.toString())) {
        socketRateLimitError(socket);
        return;
      }

      const chat = await Chat.findOneAndUpdate(
        { project: projectId },
        {
          $setOnInsert: { _id: uuid(), project: projectId },
          $push: {
            messages: {
              $each: [{
                id: uuid(),
                text: message.trim(),
                sender: socket.user._id,
                time: new Date(),
              }],
              $slice: -CHAT_HISTORY_LIMIT,
            },
          },
        },
        {
          new: true,
          upsert: true,
        },
      );

      socket.emit('messages-updated', { chat });
      socket.broadcast.to(projectId).emit('messages-updated', { chat });
    } catch (error) {
      logSocketError(socket, 'new-message', error);
    }
  });
};

export const stopChatMessageRateLimiter = () => messageRateLimiter.stop();

export default SocketHandler;
