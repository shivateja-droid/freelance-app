import { Application, Freelancer, Project, User } from '../Schema.js';
import { withLoggedTransaction } from '../observability/transaction.js';

export const createBidService = async ({ projectId, proposal, bidAmount, estimatedTime }, freelancerUser) => {
  const [freelancer, project] = await Promise.all([
    Freelancer.findOne({ user: freelancerUser._id }),
    Project.findById(projectId),
  ]);
  const client = project?.client ? await User.findById(project.client) : null;

  if (!freelancer || !project || !client) {
    const error = new Error('Unable to create bid with the provided data');
    error.status = 404;
    throw error;
  }

  if (project.status !== 'Available') {
    const error = new Error('This project is not accepting applications');
    error.status = 409;
    throw error;
  }

  try {
    await withLoggedTransaction('create_bid', async (session) => {
        const existingApplication = await Application.exists({
          project: project._id,
          freelancer: freelancerUser._id,
          status: { $in: ['Pending', 'Accepted'] },
        }).session(session);
        if (existingApplication) {
          const error = new Error('You have already applied to this project');
          error.status = 409;
          throw error;
        }

        await Application.create([{
          project: project._id,
          client: client._id,
          freelancer: freelancerUser._id,
          clientName: client.username,
          clientEmail: client.email,
          freelancerName: freelancerUser.username,
          freelancerEmail: freelancerUser.email,
          freelancerSkills: freelancer.skills,
          title: project.title,
          description: project.description,
          budget: project.budget,
          requiredSkills: project.skills,
          proposal,
          bidAmount,
          estimatedTime,
        }], { session });
    });
  } catch (error) {
    if (error.code === 11000) {
      const duplicateError = new Error('You have already applied to this project');
      duplicateError.status = 409;
      throw duplicateError;
    }
    throw error;
  }

  return { message: 'bidding successful' };
};

export const fetchApplicationsService = async (user) => {
  if (user.usertype === 'admin') return Application.find();
  if (user.usertype === 'client') {
    return Application.find({ client: user._id });
  }
  return Application.find({ freelancer: user._id });
};

const assertApplicationOwner = async (application, client, session) => {
  const project = await Project.findById(application.project).session(session);
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
  return project;
};

export const approveApplicationService = async (applicationId, client) => {
  await withLoggedTransaction('approve_application', async (session) => {
      const application = await Application.findById(applicationId).session(session);
      if (!application) {
        const error = new Error('Application not found');
        error.status = 404;
        throw error;
      }
      if (application.status !== 'Pending') {
        const error = new Error('Only pending applications can be approved');
        error.status = 409;
        throw error;
      }

      const project = await assertApplicationOwner(application, client, session);
      const [freelancer, freelancerUser] = await Promise.all([
        Freelancer.findOne({ user: application.freelancer }).session(session),
        User.findById(application.freelancer).session(session),
      ]);
      if (!freelancer || !freelancerUser) {
        const error = new Error('Unable to approve application with the provided data');
        error.status = 404;
        throw error;
      }

      const assignment = await Project.updateOne(
        { _id: project._id, status: 'Available' },
        {
          $set: {
            freelancer: freelancerUser._id,
            freelancerName: freelancerUser.email,
            budget: application.bidAmount,
            status: 'Assigned',
          },
        },
        { session },
      );
      if (assignment.modifiedCount !== 1) {
        const error = new Error('Project is no longer available');
        error.status = 409;
        throw error;
      }

      await Application.updateOne({ _id: application._id }, { $set: { status: 'Accepted' } }, { session });
      await Application.updateMany(
        { _id: { $ne: application._id }, project: project._id, status: 'Pending' },
        { $set: { status: 'Rejected' } },
        { session },
      );
  });
  return { message: 'Application approved!!' };
};

export const rejectApplicationService = async (applicationId, client) => {
  await withLoggedTransaction('reject_application', async (session) => {
      const application = await Application.findById(applicationId).session(session);
      if (!application) {
        const error = new Error('Application not found');
        error.status = 404;
        throw error;
      }
      await assertApplicationOwner(application, client, session);
      if (application.status !== 'Pending') {
        const error = new Error('Only pending applications can be rejected');
        error.status = 409;
        throw error;
      }
      await Application.updateOne({ _id: application._id }, { $set: { status: 'Rejected' } }, { session });
  });
  return { message: 'Application rejected!!' };
};
