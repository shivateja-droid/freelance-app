import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

process.env.JWT_SECRET = 'kaamsetu-test-jwt-secret';
process.env.LOG_LEVEL = 'silent';

const { Application, Chat, Freelancer, Project, User } = await import('../Schema.js');
const { app, io, server } = await import('../index.js');

let replicaSet;

export const startTestDatabase = async () => {
  replicaSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(replicaSet.getUri());
  await Promise.all([
    User.syncIndexes(),
    Freelancer.syncIndexes(),
    Project.syncIndexes(),
    Application.syncIndexes(),
    Chat.syncIndexes(),
  ]);
};

export const clearDatabase = async () => {
  await Promise.all([
    Chat.deleteMany({}),
    Application.deleteMany({}),
    Project.deleteMany({}),
    Freelancer.deleteMany({}),
    User.deleteMany({}),
  ]);
};

export const stopTestDatabase = async () => {
  await mongoose.disconnect();
  await replicaSet.stop();
};

export const createUser = async ({
  username,
  email,
  usertype,
  password = 'password123',
  skills = ['JavaScript'],
}) => {
  const user = await User.create({
    username,
    email,
    password: await bcrypt.hash(password, 4),
    usertype,
  });
  if (usertype === 'freelancer') {
    await Freelancer.create({ user: user._id, skills });
  }
  return user;
};

export const tokenFor = (user) => jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '1h' });

export const authorizationFor = (user) => `Bearer ${tokenFor(user)}`;

export const createAssignedProject = async ({ client, freelancer, budget = 500 }) => Project.create({
  client: client._id,
  freelancer: freelancer._id,
  clientName: client.username,
  clientEmail: client.email,
  freelancerName: freelancer.username,
  title: 'Test project',
  description: 'A project used only by automated tests.',
  budget,
  skills: ['JavaScript'],
  postedDate: new Date().toISOString(),
  status: 'Assigned',
});

export const waitFor = async (predicate, timeoutMs = 1_500) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await predicate();
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  assert.fail('Timed out waiting for expected result');
};

export { app, Application, Chat, Freelancer, io, Project, server, User };
