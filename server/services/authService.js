import bcrypt from 'bcrypt';
import { Freelancer, User } from '../Schema.js';

export const registerUserService = async ({ username, email, password, usertype }) => {
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = new User({
    username,
    email,
    password: passwordHash,
    usertype,
  });

  const user = await newUser.save();

  if (usertype === 'freelancer') {
    const newFreelancer = new Freelancer({
      userId: user._id,
    });

    await newFreelancer.save();
  }

  return user;
};

export const loginUserService = async ({ email, password }) => {
  const user = await User.findOne({ email });

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

  return user;
};
