import { Freelancer, Project } from '../Schema.js';

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
  clientId,
  clientName,
  clientEmail,
}) => {
  const projectSkills = skills.split(',');
  const newProject = new Project({
    title,
    description,
    budget,
    skills: projectSkills,
    clientId,
    clientName,
    clientEmail,
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
}) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  project.projectLink = projectLink;
  project.manualLink = manualLink;
  project.submissionDescription = submissionDescription;
  project.submission = true;

  await project.save();

  return { message: 'Project added' };
};

export const approveSubmissionService = async (projectId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  const freelancer = await Freelancer.findOne({ userId: project.freelancerId });

  if (!freelancer) {
    const error = new Error('Freelancer not found');
    error.status = 404;
    throw error;
  }

  project.submissionAccepted = true;
  project.status = 'Completed';

  freelancer.currentProjects = freelancer.currentProjects.filter(
    (currentProjectId) => currentProjectId.toString() !== project._id.toString(),
  );
  freelancer.completedProjects.push(project._id);
  freelancer.funds = parseInt(freelancer.funds) + parseInt(project.budget);

  await project.save();
  await freelancer.save();

  return { message: 'submission approved' };
};

export const rejectSubmissionService = async (projectId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    const error = new Error('Project not found');
    error.status = 404;
    throw error;
  }

  project.submission = false;
  project.projectLink = '';
  project.manualLink = '';
  project.submissionDescription = '';

  await project.save();

  return { message: 'submission approved' };
};
