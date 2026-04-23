import {
  approveApplicationService,
  createBidService,
  fetchApplicationsService,
  rejectApplicationService,
} from '../services/applicationService.js';
import { handleServiceError } from './handleServiceError.js';

export const createBid = async (req, res) => {
  try {
    const result = await createBidService(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const fetchApplications = async (_req, res) => {
  try {
    const applications = await fetchApplicationsService();
    return res.status(200).json(applications);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const approveApplication = async (req, res) => {
  try {
    const result = await approveApplicationService(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

export const rejectApplication = async (req, res) => {
  try {
    const result = await rejectApplicationService(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};
