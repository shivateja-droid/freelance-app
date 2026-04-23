import { Chat, Project } from "./Schema.js";
import { v4 as uuid } from 'uuid';

const ensureChatExists = async (projectId) => {
  return Chat.findOneAndUpdate(
    { _id: projectId },
    {
      $setOnInsert: {
        _id: projectId,
        messages: [],
      },
    },
    {
      new: true,
      upsert: true,
    },
  );
};

const SocketHandler = (socket) => {
  socket.on("join-chat-room", async ({ projectId, freelancerId }) => {
    try {
      const project = await Project.findById(projectId);

      if (!project || project.freelancerId !== freelancerId) {
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

  socket.on("join-chat-room-client", async ({ projectId }) => {
    try {
      const project = await Project.findById(projectId);

      if (!project || (project.status !== "Assigned" && project.status !== "Completed")) {
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

  socket.on('update-messages', async ({ projectId }) => {
    try {
      const chat = await ensureChatExists(projectId);
      socket.emit('messages-updated', { chat });
    } catch (error) {
      console.error('Error updating messages:', error);
    }
  });

  socket.on('new-message', async ({ projectId, senderId, message, time }) => {
    try {
      if (!message?.trim()) {
        return;
      }

      await ensureChatExists(projectId);

      const chat = await Chat.findOneAndUpdate(
        { _id: projectId },
        {
          $push: {
            messages: { id: uuid(), text: message, senderId, time },
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
