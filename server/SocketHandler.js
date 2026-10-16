import { Chat, Project } from "./Schema.js";
import { v4 as uuid } from 'uuid';
import { validateSocketPayload } from './middleware/validateRequest.js';
import { schemas } from './validation/schemas.js';

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
      $setOnInsert: {
        _id: uuid(),
        project: projectId,
        messages: [],
      },
    },
    {
      new: true,
      upsert: true,
    },
  );
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

const SocketHandler = (socket) => {
  socket.on("join-chat-room", async (payload = {}) => {
    try {
      const validation = validateSocketPayload(schemas.chatProject, payload);
      if (!validation.success) return socketValidationError(socket, validation);
      const { projectId } = validation.data;
      const project = await Project.findById(projectId);

      if (!project || socket.user.usertype !== 'freelancer' || project.freelancer?.toString() !== socket.user._id.toString()) {
        return;
      }

      await socket.join(projectId);
      console.log(socket.rooms);

      socket.broadcast.to(projectId).emit("user-joined-room");

      const chat = await ensureChatExists(projectId);
      socket.emit('messages-updated', { chat });
    } catch (error) {
      console.error('Error joining freelancer chat room:', error);
    }
  });

  socket.on("join-chat-room-client", async (payload = {}) => {
    try {
      const validation = validateSocketPayload(schemas.chatProject, payload);
      if (!validation.success) return socketValidationError(socket, validation);
      const { projectId } = validation.data;
      const project = await Project.findById(projectId);

      if (!project || socket.user.usertype !== 'client' || project.client?.toString() !== socket.user._id.toString() || (project.status !== "Assigned" && project.status !== "Completed")) {
        return;
      }

      await socket.join(projectId);
      console.log(socket.rooms);

      socket.broadcast.to(projectId).emit("user-joined-room");

      const chat = await ensureChatExists(projectId);
      socket.emit('messages-updated', { chat });
    } catch (error) {
      console.error('Error joining client chat room:', error);
    }
  });

  socket.on('update-messages', async (payload = {}) => {
    try {
      const validation = validateSocketPayload(schemas.chatProject, payload);
      if (!validation.success) return socketValidationError(socket, validation);
      const { projectId } = validation.data;
      if (!await getParticipantProject(projectId, socket.user)) {
        return;
      }

      const chat = await ensureChatExists(projectId);
      socket.emit('messages-updated', { chat });
    } catch (error) {
      console.error('Error updating messages:', error);
    }
  });

  socket.on('new-message', async (payload = {}) => {
    try {
      const validation = validateSocketPayload(schemas.chatMessage, payload);
      if (!validation.success) return socketValidationError(socket, validation);
      const { projectId, message } = validation.data;
      if (!await getParticipantProject(projectId, socket.user)) {
        return;
      }

      const chat = await Chat.findOneAndUpdate(
        { project: projectId },
        {
          $setOnInsert: { _id: uuid(), project: projectId },
          $push: {
            messages: {
              id: uuid(),
              text: message.trim(),
              sender: socket.user._id,
              time: new Date(),
            },
          },
        },
        {
          new: true,
        },
      );

      socket.emit('messages-updated', { chat });
      socket.broadcast.to(projectId).emit('messages-updated', { chat });
    } catch (error) {
      console.error('Error adding new message:', error);
    }
  });
};

export default SocketHandler;
