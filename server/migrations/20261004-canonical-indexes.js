import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Application, Chat, Freelancer } from '../Schema.js';

dotenv.config();

const isApply = process.argv.includes('--apply');
const rollbackIndex = process.argv.indexOf('--rollback');
const rollbackPath = rollbackIndex >= 0 ? process.argv[rollbackIndex + 1] : null;
const reportsDirectory = path.resolve('migration-reports');

const desiredIndexes = [
  {
    model: Freelancer,
    collection: 'freelancers',
    legacyName: 'user_1',
    definition: { key: { user: 1 }, name: 'freelancer_user_unique', unique: true, sparse: true },
  },
  {
    model: Application,
    collection: 'applications',
    legacyName: 'project_1_freelancer_1',
    definition: {
      key: { project: 1, freelancer: 1 },
      name: 'application_project_freelancer_unique',
      unique: true,
      partialFilterExpression: { project: { $exists: true }, freelancer: { $exists: true } },
    },
  },
  {
    model: Chat,
    collection: 'chats',
    legacyName: 'project_1',
    definition: { key: { project: 1 }, name: 'chat_project_unique', unique: true, sparse: true },
  },
];

const reportPath = () => path.join(
  reportsDirectory,
  `20261004-canonical-indexes-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);

const writeReport = async (report, filename) => {
  await fs.mkdir(reportsDirectory, { recursive: true });
  await fs.writeFile(filename, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
};

const buildReport = async () => {
  const changes = [];
  for (const target of desiredIndexes) {
    const indexes = await target.model.collection.indexes();
    const canonical = indexes.find((index) => index.name === target.definition.name);
    const legacy = indexes.find((index) => index.name === target.legacyName);

    if (canonical && legacy) {
      changes.push({ collection: target.collection, drop: legacy, create: null });
    } else if (!canonical) {
      changes.push({
        collection: target.collection,
        drop: legacy ?? null,
        create: target.definition,
      });
    }
  }
  return {
    migration: '20261004-canonical-indexes',
    generatedAt: new Date().toISOString(),
    mode: isApply ? 'apply' : 'dry-run',
    rollback: { supported: true, command: 'npm run db:rollback:relation-indexes -- migration-reports/<report-file>.json' },
    changes,
  };
};

const applyReport = async (report) => {
  for (const change of report.changes) {
    const collection = mongoose.connection.db.collection(change.collection);
    if (change.drop) await collection.dropIndex(change.drop.name);
    if (change.create) {
      await collection.createIndex(change.create.key, {
        name: change.create.name,
        unique: change.create.unique,
        sparse: change.create.sparse,
        partialFilterExpression: change.create.partialFilterExpression,
      });
    }
  }
};

const rollbackReport = async (report) => {
  for (const change of [...report.changes].reverse()) {
    const collection = mongoose.connection.db.collection(change.collection);
    if (change.create) await collection.dropIndex(change.create.name);
    if (change.drop) {
      const { key, name, ...options } = change.drop;
      await collection.createIndex(key, { name, ...options });
    }
  }
};

try {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not defined');
  await mongoose.connect(process.env.MONGO_URI);
  if (rollbackPath) {
    const report = JSON.parse(await fs.readFile(path.resolve(rollbackPath), 'utf8'));
    if (report.migration !== '20261004-canonical-indexes' || report.mode !== 'apply') {
      throw new Error('The supplied report is not an applied canonical index migration');
    }
    await rollbackReport(report);
    console.log(JSON.stringify({ mode: 'rollback', report: rollbackPath, status: 'completed' }));
  } else {
    const report = await buildReport();
    const filename = reportPath();
    await writeReport(report, filename);
    if (isApply) {
      try {
        await applyReport(report);
        report.applyStatus = 'committed';
      } catch (error) {
        report.applyStatus = 'failed';
        report.applyError = error.message;
        throw error;
      } finally {
        await writeReport(report, filename);
      }
    }
    console.log(JSON.stringify({ mode: report.mode, report: path.relative(process.cwd(), filename), changes: report.changes.length, applyStatus: report.applyStatus ?? 'not_applied' }));
  }
} finally {
  await mongoose.disconnect();
}
