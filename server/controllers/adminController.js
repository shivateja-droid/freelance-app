import { fetchUsersService } from '../services/adminService.js';
import { handleServiceError } from './handleServiceError.js';

export const fetchUsers = async (_req, res) => {
  try {
    const users = await fetchUsersService();
    return res.status(200).json(users);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
