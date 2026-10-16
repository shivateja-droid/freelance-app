import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Application, Chat, Freelancer, Project } from '../Schema.js';

dotenv.config();

const isApply = process.argv.includes('--apply');
const rollbackIndex = process.argv.indexOf('--rollback');
const rollbackPath = rollbackIndex >= 0 ? process.argv[rollbackIndex + 1] : null;
const reportsDirectory = path.resolve('migration-reports');
const models = { Application, Chat, Freelancer, Project };

const reportPath = () => path.join(
  reportsDirectory,
  `20261016-remove-legacy-relations-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);

const writeReport = async (report, destination) => {
  await fs.mkdir(reportsDirectory, { recursive: true });
  await fs.writeFile(destination, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
};

const addChange = (report, model, document, fields) => {
  const before = Object.fromEntries(fields.map((field) => [field, {
    exists: Object.hasOwn(document, field),
    value: Object.hasOwn(document, field) ? document[field] : null,
  }]));
  report.changes.push({ model, documentId: document._id.toString(), fields, before });
};

const ownLegacyFields = (document, fields) => fields.filter((field) => Object.hasOwn(document, field));

const buildReport = async () => {
  const [freelancers, projects, applications, chats] = await Promise.all([
    Freelancer.find().lean(), Project.find().lean(), Application.find().lean(), Chat.find().lean(),
  ]);
  const report = {
    migration: '20261016-remove-legacy-relations',
    generatedAt: new Date().toISOString(),
    mode: isApply ? 'apply' : 'dry-run',
    rollback: { supported: true, command: 'npm run db:rollback:legacy-relations -- migration-reports/<report-file>.json' },
    counts: { freelancers: freelancers.length, projects: projects.length, applications: applications.length, chats: chats.length },
    changes: [],
    skipped: [],
  };

  for (const freelancer of freelancers) {
    if (!freelancer.user) {
      report.skipped.push({ model: 'Freelancer', documentId: freelancer._id.toString(), reason: 'missing_canonical_user' });
      continue;
    }
    const fields = ownLegacyFields(freelancer, ['userId', 'applications', 'currentProjects', 'completedProjects']);
    if (fields.length) addChange(report, 'Freelancer', freelancer, fields);
  }
  for (const project of projects) {
    const fields = [];
    if (project.client) fields.push(...ownLegacyFields(project, ['clientId', 'bids', 'bidAmounts']));
    else if (ownLegacyFields(project, ['clientId', 'bids', 'bidAmounts']).length) {
      report.skipped.push({ model: 'Project', documentId: project._id.toString(), reason: 'missing_canonical_client' });
    }
    if (project.freelancer) fields.push(...ownLegacyFields(project, ['freelancerId']));
    else if (Object.hasOwn(project, 'freelancerId')) {
      report.skipped.push({ model: 'Project', documentId: project._id.toString(), reason: 'missing_canonical_freelancer' });
    }
    if (fields.length) addChange(report, 'Project', project, [...new Set(fields)]);
  }
  for (const application of applications) {
    const fields = ownLegacyFields(application, ['projectId', 'clientId', 'freelancerId']);
    if (!fields.length) continue;
    if (application.project && application.client && application.freelancer) addChange(report, 'Application', application, fields);
    else report.skipped.push({ model: 'Application', documentId: application._id.toString(), reason: 'missing_canonical_relationships', fields });
  }
  for (const chat of chats) {
    const hasLegacySender = (chat.messages ?? []).some((message) => Object.hasOwn(message, 'senderId'));
    if (!hasLegacySender) continue;
    if ((chat.messages ?? []).every((message) => !Object.hasOwn(message, 'senderId') || message.sender)) {
      addChange(report, 'Chat', chat, ['messages']);
    } else {
      report.skipped.push({ model: 'Chat', documentId: chat._id.toString(), reason: 'message_missing_canonical_sender' });
    }
  }
  return report;
};

const applyReport = async (report) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const change of report.changes) {
        if (change.model === 'Chat') {
          await Chat.updateOne({ _id: change.documentId }, { $unset: { 'messages.$[].senderId': 1 } }, { session });
        } else {
          await models[change.model].updateOne({ _id: change.documentId }, { $unset: Object.fromEntries(change.fields.map((field) => [field, 1])) }, { session });
        }
      }
    });
  } finally { await session.endSession(); }
};

const rollbackReport = async (report) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const change of report.changes) {
        const set = Object.fromEntries(Object.entries(change.before).filter(([, state]) => state.exists).map(([field, state]) => [field, state.value]));
        if (Object.keys(set).length) await models[change.model].updateOne({ _id: change.documentId }, { $set: set }, { session });
      }
    });
  } finally { await session.endSession(); }
};

try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not defined');
  await mongoose.connect(process.env.MONGO_URI);
  if (rollbackPath) {
    const report = JSON.parse(await fs.readFile(path.resolve(rollbackPath), 'utf8'));
    if (report.migration !== '20261016-remove-legacy-relations' || report.mode !== 'apply') throw new Error('The supplied report is not an applied legacy cleanup migration');
    await rollbackReport(report);
    console.log(JSON.stringify({ mode: 'rollback', report: rollbackPath, status: 'committed' }));
  } else {
    const report = await buildReport();
    const destination = reportPath();
    await writeReport(report, destination);
    if (isApply) {
      await applyReport(report);
      report.applyStatus = 'committed';
      await writeReport(report, destination);
    }
    console.log(JSON.stringify({ mode: report.mode, report: path.relative(process.cwd(), destination), plannedChanges: report.changes.length, skipped: report.skipped.length, applyStatus: report.applyStatus ?? 'not_applied' }));
  }
} finally { await mongoose.disconnect(); }
