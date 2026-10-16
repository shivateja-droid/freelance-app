import { Freelancer } from '../Schema.js';

export const fetchFreelancerByUserIdService = async (userId) => {
  return Freelancer.findOne({ user: userId });
};

export const updateFreelancerService = async ({ updateSkills, description }, user) => {
  const freelancer = await Freelancer.findOne({ user: user._id });

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
