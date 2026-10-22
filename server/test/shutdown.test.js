import test from 'node:test';
import assert from 'node:assert/strict';
import { createShutdownHandler } from '../config/shutdown.js';

const createTestLogger = () => {
  const events = [];
  return {
    events,
    info: (fields) => events.push(fields.event),
    error: (fields) => events.push(fields.event),
  };
};

test('completes shutdown steps once and reports success', async () => {
  const calls = [];
  const logger = createTestLogger();
  const shutdown = createShutdownHandler({
    stopAccepting: async () => calls.push('http'),
    closeSocket: async () => calls.push('socket'),
    disconnectDatabase: async () => calls.push('database'),
    logger,
    timeoutMs: 50,
  });

  const [first, second] = await Promise.all([shutdown('test'), shutdown('duplicate')]);
  assert.equal(first.status, 'completed');
  assert.equal(second, first);
  assert.deepEqual(calls, ['http', 'socket', 'database']);
  assert.deepEqual(logger.events, ['server_shutdown_started', 'server_shutdown_completed']);
});

test('reports cleanup failures without skipping later steps', async () => {
  const calls = [];
  const logger = createTestLogger();
  const shutdown = createShutdownHandler({
    stopAccepting: async () => { calls.push('http'); throw new Error('http close failed'); },
    closeSocket: async () => calls.push('socket'),
    disconnectDatabase: async () => calls.push('database'),
    logger,
    timeoutMs: 50,
  });

  const result = await shutdown('test');
  assert.equal(result.status, 'failed');
  assert.deepEqual(calls, ['http', 'socket', 'database']);
  assert.deepEqual(logger.events, ['server_shutdown_started', 'server_shutdown_failed']);
});

test('reports timeout as incomplete rather than successful cleanup', async () => {
  const logger = createTestLogger();
  const shutdown = createShutdownHandler({
    stopAccepting: async () => {},
    closeSocket: () => new Promise(() => {}),
    disconnectDatabase: async () => { throw new Error('not reached before timeout'); },
    logger,
    timeoutMs: 10,
  });

  const result = await shutdown('test');
  assert.equal(result.status, 'timed_out');
  assert.deepEqual(logger.events, ['server_shutdown_started', 'server_shutdown_timeout']);
});