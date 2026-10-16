import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  app,
  authorizationFor,
  clearDatabase,
  createUser,
  startTestDatabase,
  stopTestDatabase,
} from './helpers.js';

before(startTestDatabase);
beforeEach(clearDatabase);
after(stopTestDatabase);

test('registers allowed roles and rejects public admin registration', async () => {
  const response = await request(app)
    .post('/register')
    .send({ username: 'New Client', email: 'new-client@example.com', password: 'password123', usertype: 'client' })
    .expect(200);
  assert.equal(response.body.user.usertype, 'client');
  assert.ok(response.body.token);

  const login = await request(app)
    .post('/login')
    .send({ email: 'new-client@example.com', password: 'password123' })
    .expect(200);
  assert.equal(login.body.user.email, 'new-client@example.com');
  assert.ok(login.body.token);

  const rejected = await request(app)
    .post('/register')
    .send({ username: 'Attempted Admin', email: 'admin@example.com', password: 'password123', usertype: 'admin' })
    .expect(400);
  assert.equal(rejected.body.error, 'Invalid request data');
});

test('enforces authentication and role authorization', async () => {
  const client = await createUser({ username: 'Client', email: 'client@example.com', usertype: 'client' });
  const admin = await createUser({ username: 'Admin', email: 'admin@example.com', usertype: 'admin' });

  await request(app).get('/fetch-projects').expect(401);
  await request(app).get('/fetch-users').set('Authorization', authorizationFor(client)).expect(403);
  const response = await request(app).get('/fetch-users').set('Authorization', authorizationFor(admin)).expect(200);
  assert.equal(response.body.length, 2);
});

test('rejects malformed JSON, protected fields, and invalid identifiers', async () => {
  const client = await createUser({ username: 'Client', email: 'client@example.com', usertype: 'client' });
  const authorization = authorizationFor(client);

  const malformed = await request(app)
    .post('/register')
    .set('Content-Type', 'application/json')
    .send('{bad-json')
    .expect(400);
  assert.equal(malformed.body.error, 'Invalid request data');

  const protectedField = await request(app)
    .post('/new-project')
    .set('Authorization', authorization)
    .send({
      title: 'Valid project',
      description: 'A valid project description.',
      budget: 1_000,
      skills: 'JavaScript',
      status: 'Available',
    })
    .expect(400);
  assert.equal(protectedField.body.error, 'Invalid request data');

  await request(app).get('/fetch-project/not-an-object-id').set('Authorization', authorization).expect(400);
});
