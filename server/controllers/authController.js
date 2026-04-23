import { loginUserService, registerUserService } from '../services/authService.js';
import { handleServiceError } from './handleServiceError.js';

export const registerUser = async (req, res) => {
  try {
    const user = await registerUserService(req.body);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const loginUser = async (req, res) => {
  try {
    const user = await loginUserService(req.body);
    return res.status(200).json(user);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
