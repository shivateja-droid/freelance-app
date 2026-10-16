import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Application, Chat, Freelancer, Project, User } from '../Schema.js';

dotenv.config();

const isApply = process.argv.includes('--apply');
const rollbackIndex = process.argv.indexOf('--rollback');
const rollbackPath = rollbackIndex >= 0 ? process.argv[rollbackIndex + 1] : null;
const reportsDirectory = path.resolve('migration-reports');
const models = { Application, Chat, Freelancer, Project };

const createReportPath = () => path.join(
  reportsDirectory,
  `20261004-canonical-relations-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);

const writeReport = async (report, reportPath) => {
  await fs.mkdir(reportsDirectory, { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
};

const addIssue = (report, type, documentId, detail) => {
  report.issues.push({ type, documentId: documentId.toString(), detail });
};

const addChange = (report, model, document, after) => {
  const before = Object.fromEntries(
    Object.keys(after).map((field) => {
      const exists = Object.hasOwn(document, field);
      return [field, { exists, value: exists ? document[field] : null }];
    }),
  );

  report.changes.push({
    model,
    documentId: document._id.toString(),
    before,
    after,
  });
};

const toExistingObjectId = (value, validIds) => {
  if (typeof value !== 'string' || !mongoose.isObjectIdOrHexString(value)) {
    return null;
  }

  const objectId = new mongoose.Types.ObjectId(value);
  return validIds.has(objectId.toString()) ? objectId : null;
};

const idsOf = (documents) => new Set(documents.map((document) => document._id.toString()));

const duplicateKeys = (documents, keyForDocument) => {
  const groupedIds = new Map();

  for (const document of documents) {
    const key = keyForDocument(document);
    const ids = groupedIds.get(key) ?? [];
    ids.push(document._id.toString());
    groupedIds.set(key, ids);
  }

  return new Set([...groupedIds].filter(([, ids]) => ids.length > 1).map(([key]) => key));
};

const buildReport = async () => {
  const [users, freelancers, projects, applications, chats] = await Promise.all([
    User.find().select('_id').lean(),
    Freelancer.find().lean(),
    Project.find().lean(),
    Application.find().lean(),
    Chat.find().lean(),
  ]);

  const userIds = idsOf(users);
  const projectIds = idsOf(projects);
  const applicationIds = idsOf(applications);
  const duplicateFreelancerUsers = duplicateKeys(freelancers, (freelancer) => freelancer.userId ?? 'missing');
  const duplicateApplications = duplicateKeys(
    applications,
    (application) => `${application.projectId ?? 'missing'}:${application.freelancerId ?? 'missing'}`,
  );

  const report = {
    migration: '20261004-canonical-relations',
    generatedAt: new Date().toISOString(),
    mode: isApply ? 'apply' : 'dry-run',
    rollback: {
      supported: true,
      command: 'npm run db:rollback:relations -- migration-reports/<report-file>.json',
    },
    counts: {
      users: users.length,
      freelancers: freelancers.length,
      projects: projects.length,
      applications: applications.length,
      chats: chats.length,
    },
    changes: [],
    issues: [],
  };

  for (const freelancer of freelancers) {
    if (freelancer.user) continue;

    if (duplicateFreelancerUsers.has(freelancer.userId ?? 'missing')) {
      addIssue(report, 'duplicate_freelancer_user_reference', freelancer._id, { userId: freelancer.userId ?? null });
      continue;
    }

    const user = toExistingObjectId(freelancer.userId, userIds);
    if (user) {
      addChange(report, 'Freelancer', freelancer, { user });
    } else {
      addIssue(report, 'invalid_freelancer_user_reference', freelancer._id, { userId: freelancer.userId ?? null });
    }
  }

  for (const project of projects) {
    const after = {};
    if (!project.client) {
      const client = toExistingObjectId(project.clientId, userIds);
      if (client) after.client = client;
      else addIssue(report, 'invalid_project_client_reference', project._id, { clientId: project.clientId ?? null });
    }
    if (!project.freelancer && project.freelancerId) {
      const freelancer = toExistingObjectId(project.freelancerId, userIds);
      if (freelancer) after.freelancer = freelancer;
      else addIssue(report, 'invalid_project_freelancer_reference', project._id, { freelancerId: project.freelancerId });
    }
    if (Object.keys(after).length > 0) addChange(report, 'Project', project, after);
  }

  for (const application of applications) {
    const duplicateKey = `${application.projectId ?? 'missing'}:${application.freelancerId ?? 'missing'}`;
    if (duplicateApplications.has(duplicateKey)) {
      addIssue(report, 'duplicate_project_freelancer_application', application._id, { key: duplicateKey });
      continue;
    }

    const after = {};
    const project = toExistingObjectId(application.projectId, projectIds);
    const client = toExistingObjectId(application.clientId, userIds);
    const freelancer = toExistingObjectId(application.freelancerId, userIds);
    if (!project) addIssue(report, 'invalid_application_project_reference', application._id, { projectId: application.projectId ?? null });
    if (!client) addIssue(report, 'invalid_application_client_reference', application._id, { clientId: application.clientId ?? null });
    if (!freelancer) addIssue(report, 'invalid_application_freelancer_reference', application._id, { freelancerId: application.freelancerId ?? null });
    if (project && client && freelancer) {
      after.project = project;
      after.client = client;
      after.freelancer = freelancer;
      addChange(report, 'Application', application, after);
    }
  }

  for (const chat of chats) {
    const after = {};
    const project = toExistingObjectId(chat._id, projectIds);
    if (project && !chat.project) after.project = project;
    else if (!project) addIssue(report, 'invalid_chat_project_reference', chat._id, { projectId: chat._id });

    const messages = (chat.messages ?? []).map((message) => {
      if (message.sender) return message;
      const sender = toExistingObjectId(message.senderId, userIds);
      if (!sender) {
        addIssue(report, 'invalid_chat_message_sender_reference', chat._id, { messageId: message.id, senderId: message.senderId ?? null });
        return message;
      }
      return { ...message, sender };
    });
    if (messages.some((message, index) => message.sender && !chat.messages[index].sender)) {
      after.messages = messages;
    }
    if (Object.keys(after).length > 0) addChange(report, 'Chat', chat, after);
  }

  for (const freelancer of freelancers) {
    for (const projectId of freelancer.currentProjects ?? []) {
      if (!projectIds.has(projectId.toString())) {
        addIssue(report, 'stale_freelancer_current_project', freelancer._id, { projectId: projectId.toString() });
      }
    }
    for (const applicationId of freelancer.applications ?? []) {
      if (!applicationIds.has(applicationId.toString())) {
        addIssue(report, 'stale_freelancer_application', freelancer._id, { applicationId: applicationId.toString() });
      }
    }
  }

  return report;
};

const applyReport = async (report) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const change of report.changes) {
        await models[change.model].updateOne(
          { _id: change.documentId },
          { $set: change.after },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }
};

const rollbackReport = async (report) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const change of report.changes) {
        const set = {};
        const unset = {};
        for (const [field, state] of Object.entries(change.before)) {
          if (state.exists) set[field] = state.value;
          else unset[field] = 1;
        }
        const update = {};
        if (Object.keys(set).length > 0) update.$set = set;
        if (Object.keys(unset).length > 0) update.$unset = unset;
        await models[change.model].updateOne({ _id: change.documentId }, update, { session });
      }
    });
  } finally {
    await session.endSession();
  }
};

try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not defined');
  await mongoose.connect(process.env.MONGO_URI);

  if (rollbackPath) {
    const report = JSON.parse(await fs.readFile(path.resolve(rollbackPath), 'utf8'));
    if (report.migration !== '20261004-canonical-relations' || report.mode !== 'apply') {
      throw new Error('The supplied report is not an applied canonical relationship migration');
    }
    await rollbackReport(report);
    console.log(JSON.stringify({ mode: 'rollback', report: rollbackPath, status: 'committed' }));
  } else {
    const report = await buildReport();
    const reportPath = createReportPath();
    await writeReport(report, reportPath);
    if (isApply) {
      try {
        await applyReport(report);
        report.applyStatus = 'committed';
      } catch (error) {
        report.applyStatus = 'rolled_back';
        report.applyError = error.message;
        throw error;
      } finally {
        await writeReport(report, reportPath);
      }
    }
    console.log(JSON.stringify({
      mode: report.mode,
      report: path.relative(process.cwd(), reportPath),
      plannedChanges: report.changes.length,
      issues: report.issues.length,
      applyStatus: report.applyStatus ?? 'not_applied',
    }));
  }
} finally {
  await mongoose.disconnect();
}
