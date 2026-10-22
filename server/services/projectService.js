import { Freelancer, Project } from '../Schema.js';
import { withLoggedTransaction } from '../observability/transaction.js';

const projectFields = [
  '_id',
  'client',
  'freelancer',
  'clientName',
  'clientEmail',
  'title',
  'description',
  'budget',
  'skills',
  'postedDate',
  'status',
  'freelancerName',
  'deadline',
  'submission',
  'submissionAccepted',
  'projectLink',
  'manualLink',
  'submissionDescription',
];

const marketplaceProjectFields = [
  '_id',
  'title',
  'description',
  'budget',
  'skills',
  'postedDate',
  'status',
  'deadline',
];

const assignedFreelancerProjectFields = [
  ...marketplaceProjectFields,
  'freelancer',
  'freelancerName',
  'submission',
  'submissionAccepted',
];

const ownerProjectFields = [
  ...marketplaceProjectFields,
  'client',
  'freelancer',
  'clientName',
  'clientEmail',
  'freelancerName',
  'submission',
  'submissionAccepted',
  'projectLink',
  'manualLink',
  'submissionDescription',
];

const toProjectResponse = (project, fields) => {
  const source = project.toObject ? project.toObject() : project;
  return Object.fromEntries(fields
    .filter((field) => source[field] !== undefined)
    .map((field) => [field, source[field]]));
};

const isProjectParticipant = (project, user) => user.usertype === 'admin'
  || project.client?.toString() === user._id.toString()
  || project.freelancer?.toString() === user._id.toString();

const canViewProject = (project, user) => user.usertype === 'admin'
  || isProjectParticipant(project, user)
  || (user.usertype === 'freelancer' && project.status === 'Available');

const fieldsForProject = (project, user) => {
  if (user.usertype === 'admin') return projectFields;
  if (user.usertype === 'client' && project.client?.toString() === user._id.toString()) return ownerProjectFields;
  if (user.usertype === 'freelancer' && project.freelancer?.toString() === user._id.toString()) {
    return assignedFreelancerProjectFields;
  }
  return marketplaceProjectFields;
};

const forbiddenProject = () => {
  const error = new Error('You are not authorized to view this project');
  error.status = 403;
  return error;
};

export const fetchProjectByIdService = async (projectId, user) => {
  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }
  if (!canViewProject(project, user)) {
    throw forbiddenProject();
  }
  return toProjectResponse(project, fieldsForProject(project, user));
};

export const fetchProjectsService = async (user) => {
  const query = user.usertype === 'admin'
    ? {}
    : user.usertype === 'client'
      ? { client: user._id }
      : { $or: [{ status: 'Available' }, { freelancer: user._id }] };
  const projects = await Project.find(query);
  return projects.map((project) => toProjectResponse(project, fieldsForProject(project, user)));
};

export const createProjectService = async ({
  title,
  description,
  budget,
  skills,
}, client) => {
  const projectSkills = skills.split(',');
  const newProject = new Project({
    title,
    description,
    budget,
    skills: projectSkills,
    client: client._id,
    clientName: client.username,
    clientEmail: client.email,
    postedDate: new Date(),
  });

  await newProject.save();

  return { message: 'Project added' };
};

export const submitProjectService = async ({
  projectId,
  projectLink,
  manualLink,
  submissionDescription,
}, freelancer) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  if (project.freelancer?.toString() !== freelancer._id.toString()) {
    const error = new Error('You are not assigned to this project');
    error.status = 403;
    throw error;
  }

  const updatedProject = await Project.findOneAndUpdate(
    {
      _id: project._id,
      freelancer: freelancer._id,
      status: 'Assigned',
      $or: [{ submissionAccepted: false }, { submissionAccepted: { $exists: false } }],
      $and: [{ $or: [{ submission: false }, { submission: { $exists: false } }] }],
    },
    {
      $set: {
        projectLink,
        manualLink,
        submissionDescription,
        submission: true,
      },
    },
    { new: true },
  );

  if (!updatedProject) {
    const currentProject = await Project.findById(project._id);
    const error = new Error(
      currentProject?.submissionAccepted || currentProject?.status === 'Completed'
        ? 'This project has already been completed'
        : currentProject?.submission
          ? 'A submission is already awaiting client review'
          : 'This project is not accepting submissions',
    );
    error.status = 409;
    throw error;
  }

  return { message: 'Project added' };
};

export const approveSubmissionService = async (projectId, client) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  if (project.client?.toString() !== client._id.toString()) {
    const error = new Error('You do not own this project');
    error.status = 403;
    throw error;
  }

  const freelancer = await Freelancer.findOne({ user: project.freelancer });

  if (!freelancer) {
    const error = new Error('Freelancer not found');
    error.status = 404;
    throw error;
  }

  await withLoggedTransaction('approve_submission', async (session) => {
      const completion = await Project.updateOne(
        { _id: project._id, status: 'Assigned', submission: true, submissionAccepted: false },
        { $set: { submissionAccepted: true, status: 'Completed' } },
        { session },
      );
      if (completion.modifiedCount !== 1) {
        const error = new Error('This submission has already been processed');
        error.status = 409;
        throw error;
      }
      const credit = await Freelancer.updateOne(
        { _id: freelancer._id },
        { $inc: { funds: Number(project.budget) } },
        { session },
      );
      if (credit.modifiedCount !== 1) {
        const error = new Error('The freelancer account is no longer available');
        error.status = 409;
        throw error;
      }
  });

  return { message: 'submission approved' };
};

export const rejectSubmissionService = async (projectId, client) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  if (project.client?.toString() !== client._id.toString()) {
    const error = new Error('You do not own this project');
    error.status = 403;
    throw error;
  }

  const updatedProject = await Project.findOneAndUpdate(
    {
      _id: project._id,
      client: client._id,
      status: 'Assigned',
      submission: true,
      $or: [{ submissionAccepted: false }, { submissionAccepted: { $exists: false } }],
    },
    {
      $set: {
        submission: false,
        projectLink: '',
        manualLink: '',
        submissionDescription: '',
      },
    },
    { new: true },
  );

  if (!updatedProject) {
    const error = new Error('This submission is not awaiting client review');
    error.status = 409;
    throw error;
  }

  return { message: 'submission rejected' };
};
