import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  app,
  authorizationFor,
  clearDatabase,
  createAssignedProject,
  createUser,
  Project,
  startTestDatabase,
  stopTestDatabase,
} from './helpers.js';

before(startTestDatabase);
beforeEach(clearDatabase);
after(stopTestDatabase);

test('enforces project visibility and strips private fields from marketplace responses', async () => {
  const owner = await createUser({ username: 'Owner', email: 'owner@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'freelancer@example.com', usertype: 'freelancer' });
  const unrelatedClient = await createUser({ username: 'Other Client', email: 'other@example.com', usertype: 'client' });
  const admin = await createUser({ username: 'Admin', email: 'admin@example.com', usertype: 'admin' });
  const available = await Project.create({
    client: owner._id,
    clientName: owner.username,
    clientEmail: owner.email,
    title: 'Public marketplace project',
    description: 'A project visible to eligible marketplace freelancers.',
    budget: 500,
    skills: ['JavaScript'],
    postedDate: new Date().toISOString(),
    status: 'Available',
    projectLink: 'https://private.example/project',
    manualLink: 'https://private.example/manual',
    submissionDescription: 'Private delivery details',
  });

  await request(app).get(`/fetch-project/${available._id}`).expect(401);

  const marketplace = await request(app)
    .get(`/fetch-project/${available._id}`)
    .set('Authorization', authorizationFor(freelancer))
    .expect(200);
  assert.equal(marketplace.body.title, available.title);
  assert.equal(marketplace.body.clientEmail, undefined);
  assert.equal(marketplace.body.projectLink, undefined);
  assert.equal(marketplace.body.client, undefined);
  assert.equal(marketplace.body.freelancer, undefined);

  const marketplaceList = await request(app)
    .get('/fetch-projects')
    .set('Authorization', authorizationFor(freelancer))
    .expect(200);
  assert.equal(marketplaceList.body.length, 1);
  assert.equal(marketplaceList.body[0].clientEmail, undefined);

  const ownerDetails = await request(app)
    .get(`/fetch-project/${available._id}`)
    .set('Authorization', authorizationFor(owner))
    .expect(200);
  assert.equal(ownerDetails.body.clientEmail, owner.email);
  assert.equal(ownerDetails.body.projectLink, available.projectLink);

  await request(app)
    .get(`/fetch-project/${available._id}`)
    .set('Authorization', authorizationFor(unrelatedClient))
    .expect(403);

  const assigned = await createAssignedProject({ client: owner, freelancer });
  assigned.projectLink = 'https://private.example/assigned-project';
  assigned.manualLink = 'https://private.example/assigned-manual';
  assigned.submissionDescription = 'Private submitted work details';
  assigned.submission = true;
  assigned.submissionAccepted = false;
  await assigned.save();
  const assignedDetails = await request(app)
    .get(`/fetch-project/${assigned._id}`)
    .set('Authorization', authorizationFor(freelancer))
    .expect(200);
  assert.equal(assignedDetails.body.clientEmail, undefined);
  assert.equal(assignedDetails.body.client, undefined);
  assert.equal(assignedDetails.body.projectLink, undefined);
  assert.equal(assignedDetails.body.manualLink, undefined);
  assert.equal(assignedDetails.body.submissionDescription, undefined);
  assert.equal(assignedDetails.body.submission, true);
  assert.equal(assignedDetails.body.submissionAccepted, false);

  const adminDetails = await request(app)
    .get(`/fetch-project/${assigned._id}`)
    .set('Authorization', authorizationFor(admin))
    .expect(200);
  assert.equal(adminDetails.body.clientEmail, owner.email);
});

test('returns 404 for a missing project without weakening validation or authentication', async () => {
  const freelancer = await createUser({ username: 'Freelancer', email: 'freelancer@example.com', usertype: 'freelancer' });
  const missingId = '507f1f77bcf86cd799439011';

  await request(app)
    .get(`/fetch-project/${missingId}`)
    .set('Authorization', authorizationFor(freelancer))
    .expect(404)
    .expect({ error: 'Project not found' });

  await request(app)
    .get('/fetch-project/not-an-object-id')
    .set('Authorization', authorizationFor(freelancer))
    .expect(400);

  await request(app).get(`/fetch-project/${missingId}`).expect(401);
});

test('keeps database failures as safe server errors instead of reporting them as missing projects', async () => {
  const freelancer = await createUser({ username: 'Freelancer', email: 'freelancer@example.com', usertype: 'freelancer' });
  const originalFindById = Project.findById;
  Project.findById = async () => { throw new Error('forced database failure'); };

  try {
    await request(app)
      .get('/fetch-project/507f1f77bcf86cd799439011')
      .set('Authorization', authorizationFor(freelancer))
      .expect(500)
      .expect({ error: 'Internal server error' });
  } finally {
    Project.findById = originalFindById;
  }
});
