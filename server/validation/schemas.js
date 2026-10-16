import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Must be a valid identifier');
const nonBlank = (label, min, max) => z.string()
  .min(min, `${label} must be at least ${min} characters`)
  .max(max, `${label} must be at most ${max} characters`)
  .refine((value) => value.trim().length >= min, `${label} must not be blank`);
const positiveAmount = (label) => z.number()
  .finite(`${label} must be a number`)
  .positive(`${label} must be greater than zero`)
  .max(10_000_000, `${label} is too large`);
const skillsInput = z.string()
  .min(1, 'Skills are required')
  .max(1_000, 'Skills are too long')
  .refine((value) => {
    const skills = value.split(',').map((skill) => skill.trim());
    return skills.length <= 20 && skills.every((skill) => skill.length > 0 && skill.length <= 50);
  }, 'Provide 1 to 20 comma-separated skills, each up to 50 characters');
const httpUrl = z.string()
  .min(1, 'Link is required')
  .max(2_048, 'Link is too long')
  .url('Link must be a valid URL')
  .refine((value) => /^https?:\/\//i.test(value), 'Link must use http or https');

export const schemas = {
  register: z.object({
    username: nonBlank('Username', 3, 50),
    email: z.string().email('Email must be valid').max(254),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128, 'Password is too long'),
    usertype: z.enum(['client', 'freelancer'], { error: 'Usertype must be client or freelancer' }),
  }).strict(),
  login: z.object({
    email: z.string().email('Email must be valid').max(254),
    password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
  }).strict(),
  createProject: z.object({
    title: nonBlank('Title', 3, 120),
    description: nonBlank('Description', 10, 5_000),
    budget: positiveAmount('Budget'),
    skills: skillsInput,
  }).strict(),
  createBid: z.object({
    projectId: objectId,
    proposal: nonBlank('Proposal', 10, 5_000),
    bidAmount: positiveAmount('Bid amount'),
    estimatedTime: z.number().int('Estimated time must be a whole number').min(1).max(3_650),
  }).strict(),
  submitProject: z.object({
    projectId: objectId,
    projectLink: httpUrl,
    manualLink: httpUrl,
    submissionDescription: nonBlank('Submission description', 10, 5_000),
  }).strict(),
  updateFreelancer: z.object({
    updateSkills: skillsInput,
    description: z.string().max(2_000, 'Description is too long'),
  }).strict(),
  idParam: z.object({ id: objectId }).strict(),
  chatMessage: z.object({
    projectId: objectId,
    message: nonBlank('Message', 1, 2_000),
  }).strict(),
  chatProject: z.object({ projectId: objectId }).strict(),
};
