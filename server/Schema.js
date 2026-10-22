import mongoose, { Schema } from 'mongoose';

const { ObjectId } = Schema.Types;

const userSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  usertype: { type: String, required: true },
});

const freelancerSchema = new Schema({
  user: { type: ObjectId, ref: 'users' },
  skills: { type: [String], default: [] },
  description: { type: String, default: '' },
  funds: { type: Number, default: 0 },
});

freelancerSchema.index({ user: 1 }, { name: 'freelancer_user_unique', unique: true, sparse: true });

const projectSchema = new Schema({
  // Canonical relationships.
  client: { type: ObjectId, ref: 'users' },
  freelancer: { type: ObjectId, ref: 'users' },
  clientName: String,
  clientEmail: String,
  title: String,
  description: String,
  budget: Number,
  skills: { type: [String], default: [] },
  postedDate: String,
  status: { type: String, default: 'Available' },
  freelancerName: String,
  deadline: String,
  submission: { type: Boolean, default: false },
  submissionAccepted: { type: Boolean, default: false },
  projectLink: { type: String, default: '' },
  manualLink: { type: String, default: '' },
  submissionDescription: { type: String, default: '' },
});

const applicationSchema = new Schema({
  // Canonical relationships.
  project: { type: ObjectId, ref: 'projects' },
  client: { type: ObjectId, ref: 'users' },
  freelancer: { type: ObjectId, ref: 'users' },
  clientName: String,
  clientEmail: String,
  freelancerName: String,
  freelancerEmail: String,
  freelancerSkills: { type: [String], default: [] },
  // These are bid-time snapshots, not live Project fields.
  title: String,
  description: String,
  budget: Number,
  requiredSkills: { type: [String], default: [] },
  proposal: String,
  bidAmount: Number,
  estimatedTime: Number,
  status: { type: String, default: 'Pending' },
});

applicationSchema.index(
  { project: 1, freelancer: 1 },
  {
    name: 'application_project_freelancer_unique',
    unique: true,
    partialFilterExpression: {
      project: { $exists: true },
      freelancer: { $exists: true },
      status: { $in: ['Pending', 'Accepted'] },
    },
  },
);

const messageSchema = new Schema({
  id: { type: String, required: true },
  text: { type: String, required: true },
  sender: { type: ObjectId, ref: 'users' },
  time: Schema.Types.Mixed,
}, { _id: false });

const chatSchema = new Schema({
  // Existing documents use string primary keys; relationships use project.
  _id: { type: String, required: true },
  project: { type: ObjectId, ref: 'projects' },
  messages: { type: [messageSchema], default: [] },
});

chatSchema.index({ project: 1 }, { name: 'chat_project_unique', unique: true, sparse: true });

export const User = mongoose.model('users', userSchema);
export const Freelancer = mongoose.model('freelancer', freelancerSchema);
export const Project = mongoose.model('projects', projectSchema);
export const Application = mongoose.model('applications', applicationSchema);
export const Chat = mongoose.model('chats', chatSchema);
