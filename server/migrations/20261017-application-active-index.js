import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const indexName = 'application_project_freelancer_unique';
export const activeApplicationFilter = {
  project: { $exists: true },
  freelancer: { $exists: true },
  status: { $in: ['Pending', 'Accepted'] },
};
export const legacyFilter = {
  project: { $exists: true },
  freelancer: { $exists: true },
};
export const indexKey = { project: 1, freelancer: 1 };

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
};

const isEqual = (left, right) => JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
const hasApplicationKey = (index) => isEqual(index.key, indexKey);
const isExpectedIndex = (index) => index.unique === true
  && hasApplicationKey(index)
  && isEqual(index.partialFilterExpression, activeApplicationFilter);
const isLegacyIndex = (index) => index.unique === true
  && hasApplicationKey(index)
  && isEqual(index.partialFilterExpression, legacyFilter);

const safeIndexDescription = (index) => ({
  name: index.name,
  key: index.key,
  unique: index.unique === true,
  partialFilterExpression: index.partialFilterExpression ?? null,
  definition: isExpectedIndex(index) ? 'expected-active-only' : isLegacyIndex(index) ? 'legacy-all-statuses' : 'other',
});

export class ApplicationIndexMigrationError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'ApplicationIndexMigrationError';
    this.code = code;
    this.details = details;
  }
}

export const buildDryRunReport = () => ({
  mode: 'dry-run',
  status: 'not_applied',
  databaseAccess: 'none',
  index: {
    name: indexName,
    key: indexKey,
    unique: true,
    partialFilterExpression: activeApplicationFilter,
  },
  safetyChecks: [
    'Inspect indexes that use the project/freelancer key pair.',
    'Audit duplicate Pending or Accepted project/freelancer pairs.',
    'Refuse to replace or drop an existing matching index automatically.',
    'Verify the created index matches the expected active-only definition.',
  ],
  nextStep: 'Run with --inspect against an explicitly approved database to perform read-only index and duplicate audits.',
});

export const findDuplicateApplicationPairs = async (applications, statusFilter) => applications.aggregate([
  {
    $match: {
      project: { $exists: true },
      freelancer: { $exists: true },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
  },
  {
    $group: {
      _id: { project: '$project', freelancer: '$freelancer' },
      count: { $sum: 1 },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $limit: 21 },
]).toArray();

export const inspectApplicationIndexes = async (applications) => {
  const indexes = await applications.listIndexes().toArray();
  const matchingIndexes = indexes.filter(hasApplicationKey);
  const activeDuplicates = await findDuplicateApplicationPairs(applications, { $in: ['Pending', 'Accepted'] });
  const allStatusDuplicates = await findDuplicateApplicationPairs(applications);

  return {
    mode: 'inspect',
    status: 'read_only',
    expectedIndexPresent: matchingIndexes.some(isExpectedIndex),
    relevantIndexes: matchingIndexes.map(safeIndexDescription),
    activeDuplicatePairCount: activeDuplicates.length,
    activeDuplicatePairs: activeDuplicates,
    allStatusDuplicatePairCount: allStatusDuplicates.length,
    allStatusDuplicatePairs: allStatusDuplicates,
    duplicateResultsTruncated: activeDuplicates.length === 21 || allStatusDuplicates.length === 21,
  };
};

const assertNoDuplicates = (pairs, code, message) => {
  if (pairs.length > 0) {
    throw new ApplicationIndexMigrationError(code, message, { duplicatePairCount: pairs.length, samplePairs: pairs });
  }
};

const assertNoReplacementNeeded = (inspection, mode) => {
  const unexpectedIndexes = inspection.relevantIndexes.filter((index) => index.definition !== 'expected-active-only');
  if (mode === 'apply' && inspection.expectedIndexPresent && unexpectedIndexes.length === 0) return true;
  if (inspection.relevantIndexes.length > 0) {
    throw new ApplicationIndexMigrationError(
      'APPLICATION_INDEX_MANUAL_TRANSITION_REQUIRED',
      `Refusing ${mode}: an existing index uses the project/freelancer key pair. No index was dropped. Perform a reviewed maintenance-window transition manually.`,
      { relevantIndexes: inspection.relevantIndexes },
    );
  }
  return false;
};

const createIndexAndVerify = async (applications, partialFilterExpression) => {
  await applications.createIndex(indexKey, {
    name: indexName,
    unique: true,
    partialFilterExpression,
  });

  const indexes = await applications.listIndexes().toArray();
  const created = indexes.find((index) => index.name === indexName);
  const expected = isEqual(partialFilterExpression, activeApplicationFilter) ? isExpectedIndex(created ?? {}) : isLegacyIndex(created ?? {});
  if (!expected) {
    throw new ApplicationIndexMigrationError(
      'APPLICATION_INDEX_VERIFICATION_FAILED',
      'The index creation call completed, but the expected index definition could not be verified. No automatic cleanup was attempted.',
    );
  }
};

export const runApplicationIndexMigration = async (applications, mode) => {
  if (mode === 'dry-run') return buildDryRunReport();

  const inspection = await inspectApplicationIndexes(applications);
  if (mode === 'inspect') return inspection;

  if (mode === 'apply') {
    assertNoDuplicates(
      inspection.activeDuplicatePairs,
      'APPLICATION_INDEX_ACTIVE_DUPLICATES',
      'Refusing apply: duplicate Pending or Accepted application pairs must be resolved before creating the active-only unique index.',
    );
    if (assertNoReplacementNeeded(inspection, 'apply')) {
      return { mode, status: 'already_current', inspection };
    }
    await createIndexAndVerify(applications, activeApplicationFilter);
    return { mode, status: 'created', inspection: await inspectApplicationIndexes(applications) };
  }

  if (mode === 'rollback') {
    assertNoDuplicates(
      inspection.allStatusDuplicatePairs,
      'APPLICATION_INDEX_ROLLBACK_DUPLICATES',
      'Refusing rollback: duplicate application history would make the all-status unique index invalid. Rejected-history duplicates must be resolved before any rollback.',
    );
    const legacyIndexes = inspection.relevantIndexes.filter((index) => index.definition === 'legacy-all-statuses');
    if (legacyIndexes.length === 1 && inspection.relevantIndexes.length === 1) {
      return { mode, status: 'already_legacy', inspection };
    }
    assertNoReplacementNeeded(inspection, 'rollback');
    await createIndexAndVerify(applications, legacyFilter);
    return { mode, status: 'created', inspection: await inspectApplicationIndexes(applications) };
  }

  throw new ApplicationIndexMigrationError('APPLICATION_INDEX_INVALID_MODE', `Unsupported migration mode: ${mode}`);
};

const selectedMode = () => {
  if (process.argv.includes('--apply')) return 'apply';
  if (process.argv.includes('--rollback')) return 'rollback';
  if (process.argv.includes('--inspect')) return 'inspect';
  return 'dry-run';
};

const safeDiagnostic = (error, mode) => {
  if (error instanceof ApplicationIndexMigrationError) {
    return { mode, status: 'refused', code: error.code, error: error.message, details: error.details };
  }
  return {
    mode,
    status: 'failed',
    code: 'APPLICATION_INDEX_OPERATION_FAILED',
    error: 'The MongoDB operation failed. No automatic index cleanup was attempted; inspect the database with --inspect before retrying.',
  };
};

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  const mode = selectedMode();
  try {
    if (mode === 'dry-run') {
      console.log(JSON.stringify(buildDryRunReport()));
    } else {
      dotenv.config({ quiet: true });
      if (!process.env.MONGO_URI) throw new ApplicationIndexMigrationError('APPLICATION_INDEX_MONGO_URI_MISSING', 'MONGO_URI is not defined');
      await mongoose.connect(process.env.MONGO_URI);
      console.log(JSON.stringify(await runApplicationIndexMigration(mongoose.connection.db.collection('applications'), mode)));
    }
  } catch (error) {
    console.error(JSON.stringify(safeDiagnostic(error, mode)));
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}
