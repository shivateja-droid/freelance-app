import { Application, Freelancer, Project, User } from '../Schema.js';

export const createBidService = async ({
  clientId,
  freelancerId,
  projectId,
  proposal,
  bidAmount,
  estimatedTime,
}) => {
  const freelancer = await User.findById(freelancerId);
  const freelancerData = await Freelancer.findOne({ userId: freelancerId });
  const project = await Project.findById(projectId);
  const client = await User.findById(clientId);

  if (!freelancer || !freelancerData || !project || !client) {
    const error = new Error('Unable to create bid with the provided data');
    error.status = 404;
    throw error;
  }

  const newApplication = new Application({
    projectId,
    clientId,
    clientName: client.username,
    clientEmail: client.email,
    freelancerId,
    freelancerName: freelancer.username,
    freelancerEmail: freelancer.email,
    freelancerSkills: freelancerData.skills,
    title: project.title,
    description: project.description,
    budget: project.budget,
    requiredSkills: project.skills,
    proposal,
    bidAmount,
    estimatedTime,
  });

  const application = await newApplication.save();

  project.bids.push(freelancerId);
  project.bidAmounts.push(parseInt(bidAmount));

  if (application) {
    freelancerData.applications.push(application._id);
  }

  await freelancerData.save();
  await project.save();

  return { message: 'bidding successful' };
};

export const fetchApplicationsService = async () => {
  return Application.find();
};

export const approveApplicationService = async (applicationId) => {
  const application = await Application.findById(applicationId);

  if (!application) {
    const error = new Error('Application not found');
    error.status = 404;
    throw error;
  }

  const project = await Project.findById(application.projectId);
  const freelancer = await Freelancer.findOne({ userId: application.freelancerId });
  const user = await User.findById(application.freelancerId);

  if (!project || !freelancer || !user) {
    const error = new Error('Unable to approve application with the provided data');
    error.status = 404;
    throw error;
  }

  application.status = 'Accepted';
  await application.save();

  const remainingApplications = await Application.find({
    projectId: application.projectId,
    status: 'Pending',
  });

  await Promise.all(
    remainingApplications.map(async (pendingApplication) => {
      pendingApplication.status = 'Rejected';
      await pendingApplication.save();
    }),
  );

  project.freelancerId = freelancer.userId;
  project.freelancerName = user.email;
  project.budget = application.bidAmount;
  project.status = 'Assigned';

  freelancer.currentProjects.push(project._id);

  await project.save();
  await freelancer.save();

  return { message: 'Application approved!!' };
};

export const rejectApplicationService = async (applicationId) => {
  const application = await Application.findById(applicationId);

  if (!application) {
    const error = new Error('Application not found');
    error.status = 404;
    throw error;
  }

  application.status = 'Rejected';
  await application.save();

  return { message: 'Application rejected!!' };
};
