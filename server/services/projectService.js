import { Freelancer, Project } from '../Schema.js';
import { withLoggedTransaction } from '../observability/transaction.js';

export const fetchProjectByIdService = async (projectId) => {
  return Project.findById(projectId);
};

export const fetchProjectsService = async () => {
  return Project.find();
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

  project.projectLink = projectLink;
  project.manualLink = manualLink;
  project.submissionDescription = submissionDescription;
  project.submission = true;

  await project.save();

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
        { _id: project._id, submission: true, submissionAccepted: false },
        { $set: { submissionAccepted: true, status: 'Completed' } },
        { session },
      );
      if (completion.modifiedCount !== 1) {
        const error = new Error('This submission has already been processed');
        error.status = 409;
        throw error;
      }
      await Freelancer.updateOne({ _id: freelancer._id }, { $inc: { funds: Number(project.budget) } }, { session });
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

  project.submission = false;
  project.projectLink = '';
  project.manualLink = '';
  project.submissionDescription = '';

  await project.save();

  return { message: 'submission approved' };
};
