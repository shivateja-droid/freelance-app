import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { io as socketClient } from 'socket.io-client';
import {
  Chat,
  clearDatabase,
  createAssignedProject,
  createUser,
  io,
  server,
  startTestDatabase,
  stopTestDatabase,
  tokenFor,
  waitFor,
} from './helpers.js';

let address;

const connect = (token) => new Promise((resolve, reject) => {
  const socket = socketClient(address, { auth: token ? { token } : {}, forceNew: true, transports: ['websocket'] });
  socket.once('connect', () => resolve(socket));
  socket.once('connect_error', (error) => reject(error));
});

before(async () => {
  await startTestDatabase();
  await new Promise((resolve) => server.listen(0, resolve));
  address = `http://127.0.0.1:${server.address().port}`;
});
beforeEach(clearDatabase);
after(async () => {
  await io.close();
  await new Promise((resolve) => server.close(resolve));
  await stopTestDatabase();
});

test('rejects unauthenticated socket connections', async () => {
  await assert.rejects(connect(), /Authentication required/);
});

test('blocks nonparticipants and assigns chat sender from the authenticated socket user', async () => {
  const client = await createUser({ username: 'Client', email: 'client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'freelancer@example.com', usertype: 'freelancer' });
  const outsider = await createUser({ username: 'Outsider', email: 'outsider@example.com', usertype: 'freelancer' });
  const project = await createAssignedProject({ client, freelancer });
  const outsiderSocket = await connect(tokenFor(outsider));
  try {
    outsiderSocket.emit('new-message', { projectId: project._id.toString(), message: 'This must not be stored.' });
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(await Chat.countDocuments({ project: project._id }), 0);
  } finally {
    outsiderSocket.disconnect();
  }

  const clientSocket = await connect(tokenFor(client));
  try {
    const validationError = new Promise((resolve) => clientSocket.once('request-error', resolve));
    clientSocket.emit('new-message', { projectId: project._id.toString(), message: 'Spoof attempt', sender: outsider._id.toString() });
    const error = await validationError;
    assert.equal(error.error, 'Invalid request data');

    const messageUpdated = Promise.race([
      new Promise((resolve) => clientSocket.once('messages-updated', resolve)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timed out waiting for messages-updated')), 1_500)),
    ]);
    clientSocket.emit('new-message', { projectId: project._id.toString(), message: 'Authenticated sender message' });
    const [chat] = await Promise.all([
      waitFor(async () => {
        const result = await Chat.findOne({ project: project._id });
        return result?.messages.length === 1 ? result : null;
      }),
      messageUpdated,
    ]);
    assert.equal(chat.messages[0].sender.toString(), client._id.toString());
    assert.equal(chat.messages[0].text, 'Authenticated sender message');
  } finally {
    clientSocket.disconnect();
  }
});
