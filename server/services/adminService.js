import { User } from '../Schema.js';

export const fetchUsersService = async () => {
  return User.find();
};
