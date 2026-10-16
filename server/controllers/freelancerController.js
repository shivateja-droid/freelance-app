import {
  fetchFreelancerByUserIdService,
  updateFreelancerService,
} from '../services/freelancerService.js';
import { handleServiceError } from './handleServiceError.js';

export const fetchFreelancer = async (req, res) => {
  try {
    if (req.user.usertype !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ error: 'You can only view your own freelancer profile' });
    }
    const freelancer = await fetchFreelancerByUserIdService(req.params.id);
    return res.status(200).json(freelancer);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};

export const updateFreelancer = async (req, res) => {
  try {
    const freelancer = await updateFreelancerService(req.body, req.user);
    return res.status(200).json(freelancer);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};
