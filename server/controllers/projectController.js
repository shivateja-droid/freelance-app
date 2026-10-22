import {
  approveSubmissionService,
  createProjectService,
  fetchProjectByIdService,
  fetchProjectsService,
  rejectSubmissionService,
  submitProjectService,
} from '../services/projectService.js';
import { handleServiceError } from './handleServiceError.js';

export const fetchProject = async (req, res) => {
  try {
    const project = await fetchProjectByIdService(req.params.id, req.user);
    return res.status(200).json(project);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};

export const fetchProjects = async (req, res) => {
  try {
    const projects = await fetchProjectsService(req.user);
    return res.status(200).json(projects);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};

export const createProject = async (req, res) => {
  try {
    const result = await createProjectService(req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};

export const submitProject = async (req, res) => {
  try {
    const result = await submitProjectService(req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};

export const approveSubmission = async (req, res) => {
  try {
    const result = await approveSubmissionService(req.params.id, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};

export const rejectSubmission = async (req, res) => {
  try {
    const result = await rejectSubmissionService(req.params.id, req.user);
    return res.status(200).json(result);
  } catch (error) {
    return handleServiceError(req, res, error);
  }
};
