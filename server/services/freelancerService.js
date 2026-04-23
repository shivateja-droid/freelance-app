import { Freelancer } from '../Schema.js';

export const fetchFreelancerByUserIdService = async (userId) => {
  return Freelancer.findOne({ userId });
};

export const updateFreelancerService = async ({ freelancerId, updateSkills, description }) => {
  const freelancer = await Freelancer.findById(freelancerId);

  if (!freelancer) {
    const error = new Error('Freelancer not found');
    error.status = 404;
    throw error;
  }

  const skills = updateSkills.split(',');

  freelancer.skills = skills;
  freelancer.description = description;

  await freelancer.save();

  return freelancer;
};
