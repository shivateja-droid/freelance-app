import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Freelancer, User } from '../Schema.js';
import { withLoggedTransaction } from '../observability/transaction.js';

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

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    const error = new Error('An account with this email already exists');
    error.status = 409;
    throw error;
  }

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    email: normalizedEmail,
    password: passwordHash,
    usertype,
  });

  let user;
  await withLoggedTransaction('register_user', async (session) => {
      [user] = await User.create([newUser], { session });
      if (usertype === 'freelancer') {
        await Freelancer.create([{ user: user._id }], { session });
      }
  });

  return createAuthResponse(user);
};

export const loginUserService = async ({ email, password }) => {
  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    const error = new Error('Invalid email or password.');
    error.status = 400;
    error.responseKey = 'msg';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.status = 400;
    error.responseKey = 'msg';
    throw error;
  }

  return createAuthResponse(user);
};
