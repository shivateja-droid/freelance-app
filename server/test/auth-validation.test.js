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

test('returns a safe conflict for duplicate registration email', async () => {
  await createUser({ username: 'Existing User', email: 'existing@example.com', usertype: 'client' });

  const response = await request(app)
    .post('/register')
    .send({ username: 'Another User', email: 'EXISTING@example.com', password: 'password123', usertype: 'client' })
    .expect(409);

  assert.deepEqual(response.body, { error: 'An account with this email already exists' });
});

test('enforces the eight-character registration password minimum', async () => {
  const tooShort = await request(app)
    .post('/register')
    .send({ username: 'Short Password', email: 'short@example.com', password: '1234567', usertype: 'client' })
    .expect(400);
  assert.deepEqual(tooShort.body.details[0], {
    field: 'password',
    message: 'Password must be at least 8 characters',
  });

  await request(app)
    .post('/register')
    .send({ username: 'Eight Characters', email: 'eight@example.com', password: '12345678', usertype: 'client' })
    .expect(200);
});

test('uses the same safe login error for unknown email and wrong password', async () => {
  await createUser({ username: 'Login User', email: 'login@example.com', usertype: 'client', password: 'password123' });

  const wrongPassword = await request(app)
    .post('/login')
    .send({ email: 'login@example.com', password: 'wrong-password' })
    .expect(400);
  const unknownEmail = await request(app)
    .post('/login')
    .send({ email: 'unknown@example.com', password: 'wrong-password' })
    .expect(400);

  assert.deepEqual(wrongPassword.body, { msg: 'Invalid email or password.' });
  assert.deepEqual(unknownEmail.body, wrongPassword.body);
});

test('rejects missing login fields through backend validation', async () => {
  const response = await request(app).post('/login').send({}).expect(400);
  assert.equal(response.body.error, 'Invalid request data');
  assert.ok(response.body.details.some((detail) => detail.field === 'email'));
  assert.ok(response.body.details.some((detail) => detail.field === 'password'));
});
