import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Freelancer, User } from '../Schema.js';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
};

const toSafeUser = (user) => ({
  _id: user._id,
  username: user.username,
  email: user.email,
  usertype: user.usertype,
});

const createAuthResponse = (user) => ({
  token: jwt.sign({ sub: user._id.toString() }, getJwtSecret(), { expiresIn: '12h' }),
  user: toSafeUser(user),
});

export const registerUserService = async ({ username, email, password, usertype }) => {
  if (usertype === 'admin') {
    const error = new Error('Admin accounts cannot be created through public registration');
    error.status = 403;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    email: email.trim().toLowerCase(),
    password: passwordHash,
    usertype,
  });

  const session = await mongoose.startSession();
  let user;
  try {
    await session.withTransaction(async () => {
      [user] = await User.create([newUser], { session });
      if (usertype === 'freelancer') {
        await Freelancer.create([{ user: user._id }], { session });
      }
    });
  } finally {
    await session.endSession();
  }

  return createAuthResponse(user);
};

export const loginUserService = async ({ email, password }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    const error = new Error('User does not exist');
    error.status = 400;
    error.responseKey = 'msg';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error('Invalid credentials');
    error.status = 400;
    error.responseKey = 'msg';
    throw error;
  }

  return createAuthResponse(user);
};
