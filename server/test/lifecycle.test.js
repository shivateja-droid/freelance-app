import test, { after, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {
  app,
  Application,
  authorizationFor,
  clearDatabase,
  createUser,
  Freelancer,
  Project,
  startTestDatabase,
  stopTestDatabase,
} from './helpers.js';
import { approveSubmissionService } from '../services/projectService.js';

before(startTestDatabase);
beforeEach(clearDatabase);
after(stopTestDatabase);

const projectPayload = {
  title: 'Marketplace test project',
  description: 'A complete project used by the KaamSetu automated test suite.',
  budget: 1_000,
  skills: 'JavaScript, React',
};

test('runs the project lifecycle and rejects competing applications', async () => {
  const client = await createUser({ username: 'Client', email: 'client@example.com', usertype: 'client' });
  const otherClient = await createUser({ username: 'Other Client', email: 'other-client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'freelancer@example.com', usertype: 'freelancer' });
  const competitor = await createUser({ username: 'Competitor', email: 'competitor@example.com', usertype: 'freelancer' });
  const clientAuth = authorizationFor(client);

  await request(app).post('/new-project').set('Authorization', clientAuth).send(projectPayload).expect(200);
  const project = await Project.findOne({ title: projectPayload.title });
  assert.equal(project.status, 'Available');

  const bidPayload = {
    projectId: project._id.toString(),
    proposal: 'I can complete this project with a tested React implementation.',
    bidAmount: 750,
    estimatedTime: 7,
  };
  await request(app).post('/make-bid').set('Authorization', authorizationFor(freelancer)).send(bidPayload).expect(200);
  await request(app).post('/make-bid').set('Authorization', authorizationFor(competitor)).send({ ...bidPayload, proposal: 'I can also complete the project successfully.' }).expect(200);
  await request(app).post('/make-bid').set('Authorization', authorizationFor(freelancer)).send(bidPayload).expect(409);

  const accepted = await Application.findOne({ project: project._id, freelancer: freelancer._id });
  await request(app).get(`/approve-application/${accepted._id}`).set('Authorization', authorizationFor(otherClient)).expect(403);
  await request(app).get(`/approve-application/${accepted._id}`).set('Authorization', clientAuth).expect(200);
  const assigned = await Project.findById(project._id);
  assert.equal(assigned.status, 'Assigned');
  assert.equal(assigned.freelancer.toString(), freelancer._id.toString());
  assert.equal(assigned.budget, 750);
  assert.equal((await Application.findOne({ project: project._id, freelancer: competitor._id })).status, 'Rejected');

  await request(app)
    .post('/submit-project')
    .set('Authorization', authorizationFor(freelancer))
    .send({
      projectId: project._id.toString(),
      projectLink: 'https://example.com/project',
      manualLink: 'https://example.com/manual',
      submissionDescription: 'The completed implementation and manual are available at these links.',
    })
    .expect(200);
  await request(app).get(`/approve-submission/${project._id}`).set('Authorization', clientAuth).expect(200);

  const completed = await Project.findById(project._id);
  const freelancerProfile = await Freelancer.findOne({ user: freelancer._id });
  assert.equal(completed.status, 'Completed');
  assert.equal(completed.submissionAccepted, true);
  assert.equal(freelancerProfile.funds, 750);
});

test('allows only one concurrent bid and keeps a single canonical application', async () => {
  const client = await createUser({ username: 'Client', email: 'client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'freelancer@example.com', usertype: 'freelancer' });
  const project = await Project.create({ ...projectPayload, client: client._id, clientName: client.username, clientEmail: client.email, postedDate: new Date().toISOString() });
  const bid = {
    projectId: project._id.toString(),
    proposal: 'I can complete this project with careful implementation details.',
    bidAmount: 750,
    estimatedTime: 7,
  };
  const authorization = authorizationFor(freelancer);
  const responses = await Promise.all([
    request(app).post('/make-bid').set('Authorization', authorization).send(bid),
    request(app).post('/make-bid').set('Authorization', authorization).send(bid),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.equal(await Application.countDocuments({ project: project._id, freelancer: freelancer._id }), 1);
});

test('rolls back project completion when freelancer credit fails', async () => {
  const client = await createUser({ username: 'Client', email: 'client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'freelancer@example.com', usertype: 'freelancer' });
  const project = await Project.create({
    ...projectPayload,
    client: client._id,
    freelancer: freelancer._id,
    clientName: client.username,
    clientEmail: client.email,
    postedDate: new Date().toISOString(),
    status: 'Assigned',
    submission: true,
  });
  const originalUpdateOne = Freelancer.updateOne;
  Freelancer.updateOne = async () => { throw new Error('forced credit failure'); };
  try {
    await assert.rejects(approveSubmissionService(project._id.toString(), client), /forced credit failure/);
  } finally {
    Freelancer.updateOne = originalUpdateOne;
  }
  const persistedProject = await Project.findById(project._id);
  const profile = await Freelancer.findOne({ user: freelancer._id });
  assert.equal(persistedProject.status, 'Assigned');
  assert.equal(persistedProject.submissionAccepted, false);
  assert.equal(profile.funds, 0);
});
