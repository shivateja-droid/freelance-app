import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  app,
  clearDatabase,
  startTestDatabase,
  stopTestDatabase,
} from './helpers.js';
import { createOriginPolicy, localDevelopmentOrigin, parseClientOrigins } from '../config/cors.js';

before(startTestDatabase);
beforeEach(clearDatabase);
after(stopTestDatabase);

test('parses exact HTTPS origins and blocks malformed deployment configuration', () => {
  const origins = parseClientOrigins('https://kaamsetu-wheat.vercel.app, https://preview.example.vercel.app');
  const policy = createOriginPolicy(origins);
  assert.equal(policy.allows('https://kaamsetu-wheat.vercel.app'), true);
  assert.equal(policy.allows('https://preview.example.vercel.app'), true);
  assert.equal(policy.allows('https://unlisted.example'), false);
  assert.equal(policy.allows(undefined), true);
  const developmentOrigins = parseClientOrigins('', { allowLocalOrigin: true });
  assert.equal(createOriginPolicy(developmentOrigins).allows(localDevelopmentOrigin), true);
  assert.equal(createOriginPolicy(parseClientOrigins('https://kaamsetu-wheat.vercel.app')).allows(localDevelopmentOrigin), false);
  assert.throws(() => parseClientOrigins('https://kaamsetu-wheat.vercel.app/'), /CLIENT_ORIGINS/);
  assert.throws(() => parseClientOrigins('http://localhost:5173'), /CLIENT_ORIGINS/);
});

test('allows the configured production origin and blocks preview origins by default', async () => {
  const productionOrigin = 'https://kaamsetu-wheat.vercel.app';
  const allowed = await request(app)
    .options('/health/live')
    .set('Origin', productionOrigin)
    .set('Access-Control-Request-Method', 'GET')
    .expect(204);
  assert.equal(allowed.headers['access-control-allow-origin'], productionOrigin);

  const blocked = await request(app)
    .get('/health/live')
    .set('Origin', 'https://preview.kaamsetu-wheat.vercel.app')
    .expect(403);
  assert.deepEqual(blocked.body, { error: 'Origin not allowed' });
});

test('permits no-origin health checks', async () => {
  const response = await request(app).get('/health/live').expect(200);
  assert.deepEqual(response.body, { status: 'ok' });
});

test('sets API security headers and rejects oversized JSON bodies', async () => {
  const headers = await request(app).get('/health/live').expect(200);
  assert.equal(headers.headers['x-powered-by'], undefined);
  assert.equal(headers.headers['x-content-type-options'], 'nosniff');

  await request(app)
    .post('/login')
    .send({ email: 'large@example.com', password: 'x'.repeat(1_100_000) })
    .expect(413);
});

test('returns a safe response after the login rate limit is exceeded', async () => {
  const responses = await Promise.all(Array.from({ length: 11 }, () => request(app)
    .post('/login')
    .send({ email: 'rate-limit@example.com', password: 'not-the-password' })));
  const limited = responses.find((response) => response.status === 429);

  assert.ok(limited);
  assert.deepEqual(limited.body, { error: 'Too many requests, please try again later' });
  assert.match(limited.headers['ratelimit'] || limited.headers['ratelimit-limit'], /10/);
});
