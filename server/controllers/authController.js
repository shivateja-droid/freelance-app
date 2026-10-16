import { loginUserService, registerUserService } from '../services/authService.js';
import { handleServiceError } from './handleServiceError.js';

export const registerUser = async (req, res) => {
  try {
    const user = await registerUserService(req.body);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await loginUserService(req.body);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    user: {
      _id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      usertype: req.user.usertype,
    },
  });
};
