import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Application, Chat, Freelancer, Project } from '../Schema.js';

dotenv.config();

try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not defined');
  await mongoose.connect(process.env.MONGO_URI);

  const chatSenderIds = await Chat.aggregate([
    { $unwind: '$messages' },
    { $match: { 'messages.senderId': { $exists: true } } },
    { $count: 'count' },
  ]);
  const audit = {
    canonical: {
      freelancersWithoutUser: await Freelancer.countDocuments({ user: { $exists: false } }),
      projectsWithoutClient: await Project.countDocuments({ client: { $exists: false } }),
      applicationsWithoutProject: await Application.countDocuments({ project: { $exists: false } }),
      applicationsWithoutClient: await Application.countDocuments({ client: { $exists: false } }),
      applicationsWithoutFreelancer: await Application.countDocuments({ freelancer: { $exists: false } }),
      chatsWithoutProject: await Chat.countDocuments({ project: { $exists: false } }),
    },
    remainingLegacyFields: {
      freelancerUserId: await Freelancer.countDocuments({ userId: { $exists: true } }),
      freelancerReverseArrays: await Freelancer.countDocuments({ $or: [{ applications: { $exists: true } }, { currentProjects: { $exists: true } }, { completedProjects: { $exists: true } }] }),
      projectRelationshipFields: await Project.countDocuments({ $or: [{ clientId: { $exists: true } }, { freelancerId: { $exists: true } }, { bids: { $exists: true } }, { bidAmounts: { $exists: true } }] }),
      applicationRelationshipFields: await Application.countDocuments({ $or: [{ projectId: { $exists: true } }, { clientId: { $exists: true } }, { freelancerId: { $exists: true } }] }),
      chatSenderIds: chatSenderIds[0]?.count ?? 0,
    },
  };

  console.log(JSON.stringify(audit));
} finally {
  await mongoose.disconnect();
}
