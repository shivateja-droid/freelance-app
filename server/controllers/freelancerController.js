import {
  fetchFreelancerByUserIdService,
  updateFreelancerService,
} from '../services/freelancerService.js';
import { handleServiceError } from './handleServiceError.js';

export const fetchFreelancer = async (req, res) => {
  try {
    const freelancer = await fetchFreelancerByUserIdService(req.params.id);
    return res.status(200).json(freelancer);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const updateFreelancer = async (req, res) => {
  try {
    const freelancer = await updateFreelancerService(req.body);
    return res.status(200).json(freelancer);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
