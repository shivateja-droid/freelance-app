import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import pino from 'pino';
import request from 'supertest';
import {
  app,
  authorizationFor,
  clearDatabase,
  createUser,
  Project,
  startTestDatabase,
  stopTestDatabase,
} from './helpers.js';
import { loggerOptions } from '../observability/logger.js';

before(startTestDatabase);
beforeEach(clearDatabase);
after(stopTestDatabase);

test('returns liveness and database readiness without infrastructure details', async () => {
  const live = await request(app).get('/health/live').expect(200);
  assert.deepEqual(live.body, { status: 'ok' });

  const ready = await request(app).get('/health/ready').expect(200);
  assert.deepEqual(ready.body, { status: 'ready', database: 'connected' });
  assert.equal(JSON.stringify(ready.body).includes('mongodb://'), false);
});

test('returns and accepts safe request correlation ids', async () => {
  const suppliedId = 'request_12345678';
  const response = await request(app).get('/health/live').set('X-Request-Id', suppliedId).expect(200);
  assert.equal(response.headers['x-request-id'], suppliedId);

  const generated = await request(app).get('/health/live').set('X-Request-Id', 'bad id').expect(200);
  assert.match(generated.headers['x-request-id'], /^[0-9a-f-]{36}$/);
});

test('redacts sensitive structured log fields', () => {
  const { transport: _transport, ...testLoggerOptions } = loggerOptions;
  let output = '';
  const destination = { write: (line) => { output += line; } };
  const testLogger = pino({ ...testLoggerOptions, level: 'info' }, destination);
  testLogger.info({
    password: 'plain-password',
    token: 'jwt-value',
    mongoUri: 'mongodb://sensitive-host',
    req: { headers: { authorization: 'Bearer secret' }, body: { password: 'body-password' } },
  }, 'redaction test');
  assert.equal(output.includes('plain-password'), false);
  assert.equal(output.includes('jwt-value'), false);
  assert.equal(output.includes('sensitive-host'), false);
  assert.equal(output.includes('Bearer secret'), false);
  assert.match(output, /\[Redacted\]/);
});

test('logs internal failures server-side while returning a safe error body', async () => {
  const client = await createUser({ username: 'Client', email: 'client@example.com', usertype: 'client' });
  const originalFind = Project.find;
  Project.find = () => { throw new Error('database internals must stay private'); };
  try {
    const response = await request(app)
      .get('/fetch-projects')
      .set('Authorization', authorizationFor(client))
      .expect(500);
    assert.deepEqual(response.body, { error: 'Internal server error' });
    assert.equal(JSON.stringify(response.body).includes('database internals'), false);
  } finally {
    Project.find = originalFind;
  }
});
