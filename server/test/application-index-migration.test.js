import test from 'node:test';
import assert from 'node:assert/strict';
import {
  activeApplicationFilter,
  buildDryRunReport,
  indexKey,
  indexName,
  inspectApplicationIndexes,
  legacyFilter,
  runApplicationIndexMigration,
} from '../migrations/20261017-application-active-index.js';

const expectedIndex = {
  name: indexName,
  key: indexKey,
  unique: true,
  partialFilterExpression: activeApplicationFilter,
};

const legacyIndex = {
  name: indexName,
  key: indexKey,
  unique: true,
  partialFilterExpression: legacyFilter,
};

const createCollection = ({ indexes = [], activeDuplicates = [], allDuplicates = [], createIndexError } = {}) => {
  const storedIndexes = [...indexes];
  const calls = { createIndex: 0, dropIndex: 0, aggregates: [] };
  const collection = {
    listIndexes: () => ({ toArray: async () => storedIndexes }),
    aggregate: (pipeline) => {
      calls.aggregates.push(pipeline);
      const statusFilter = pipeline[0].$match.status;
      return { toArray: async () => statusFilter ? activeDuplicates : allDuplicates };
    },
    createIndex: async (key, options) => {
      calls.createIndex += 1;
      if (createIndexError) throw createIndexError;
      storedIndexes.push({ key, ...options });
    },
    dropIndex: async () => {
      calls.dropIndex += 1;
    },
  };
  return { collection, calls };
};

test('keeps dry-run offline and describes the intended safety checks', async () => {
  const report = await runApplicationIndexMigration(null, 'dry-run');

  assert.deepEqual(report, buildDryRunReport());
  assert.equal(report.databaseAccess, 'none');
  assert.deepEqual(report.index.partialFilterExpression, activeApplicationFilter);
});

test('inspects relevant indexes and audits active and historical duplicate pairs read-only', async () => {
  const activeDuplicate = { _id: { project: 'project-a', freelancer: 'freelancer-a' }, count: 2 };
  const historicalDuplicate = { _id: { project: 'project-b', freelancer: 'freelancer-b' }, count: 2 };
  const { collection, calls } = createCollection({
    indexes: [expectedIndex, { name: 'unrelated', key: { status: 1 } }],
    activeDuplicates: [activeDuplicate],
    allDuplicates: [activeDuplicate, historicalDuplicate],
  });

  const report = await inspectApplicationIndexes(collection);

  assert.equal(report.status, 'read_only');
  assert.equal(report.expectedIndexPresent, true);
  assert.deepEqual(report.relevantIndexes, [{ ...expectedIndex, definition: 'expected-active-only' }]);
  assert.deepEqual(report.activeDuplicatePairs, [activeDuplicate]);
  assert.deepEqual(report.allStatusDuplicatePairs, [activeDuplicate, historicalDuplicate]);
  assert.equal(calls.createIndex, 0);
  assert.equal(calls.dropIndex, 0);
});

test('refuses apply when active duplicate pairs exist without modifying indexes', async () => {
  const duplicate = { _id: { project: 'project-a', freelancer: 'freelancer-a' }, count: 2 };
  const { collection, calls } = createCollection({ activeDuplicates: [duplicate], allDuplicates: [duplicate] });

  await assert.rejects(
    () => runApplicationIndexMigration(collection, 'apply'),
    (error) => error.code === 'APPLICATION_INDEX_ACTIVE_DUPLICATES',
  );
  assert.equal(calls.createIndex, 0);
  assert.equal(calls.dropIndex, 0);
});

test('refuses an unsafe legacy-index transition without dropping existing protection', async () => {
  const { collection, calls } = createCollection({ indexes: [legacyIndex] });

  await assert.rejects(
    () => runApplicationIndexMigration(collection, 'apply'),
    (error) => error.code === 'APPLICATION_INDEX_MANUAL_TRANSITION_REQUIRED',
  );
  assert.equal(calls.createIndex, 0);
  assert.equal(calls.dropIndex, 0);
});

test('creates and verifies the active-only index on a database with no matching index', async () => {
  const { collection, calls } = createCollection();

  const report = await runApplicationIndexMigration(collection, 'apply');

  assert.equal(report.status, 'created');
  assert.equal(report.inspection.expectedIndexPresent, true);
  assert.equal(calls.createIndex, 1);
  assert.equal(calls.dropIndex, 0);
});

test('leaves existing indexes untouched when index creation fails', async () => {
  const { collection, calls } = createCollection({ createIndexError: new Error('simulated index creation failure') });

  await assert.rejects(() => runApplicationIndexMigration(collection, 'apply'), /simulated index creation failure/);
  assert.equal(calls.createIndex, 1);
  assert.equal(calls.dropIndex, 0);
});

test('refuses rollback when rejected-history duplicates would invalidate all-status uniqueness', async () => {
  const historicalDuplicate = { _id: { project: 'project-a', freelancer: 'freelancer-a' }, count: 2 };
  const { collection, calls } = createCollection({ indexes: [expectedIndex], allDuplicates: [historicalDuplicate] });

  await assert.rejects(
    () => runApplicationIndexMigration(collection, 'rollback'),
    (error) => error.code === 'APPLICATION_INDEX_ROLLBACK_DUPLICATES',
  );
  assert.equal(calls.createIndex, 0);
  assert.equal(calls.dropIndex, 0);
});

test('refuses rollback of an active-only index even when duplicate checks pass', async () => {
  const { collection, calls } = createCollection({ indexes: [expectedIndex] });

  await assert.rejects(
    () => runApplicationIndexMigration(collection, 'rollback'),
    (error) => error.code === 'APPLICATION_INDEX_MANUAL_TRANSITION_REQUIRED',
  );
  assert.equal(calls.createIndex, 0);
  assert.equal(calls.dropIndex, 0);
});
