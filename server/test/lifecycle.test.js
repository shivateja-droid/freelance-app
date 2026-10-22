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

test('installs an active-only unique application index', async () => {
  const indexes = await Application.collection.indexes();
  const activeApplicationIndex = indexes.find((index) => index.name === 'application_project_freelancer_unique');

  assert.ok(activeApplicationIndex);
  assert.deepEqual(activeApplicationIndex.key, { project: 1, freelancer: 1 });
  assert.equal(activeApplicationIndex.unique, true);
  assert.deepEqual(activeApplicationIndex.partialFilterExpression, {
    project: { $exists: true },
    freelancer: { $exists: true },
    status: { $in: ['Pending', 'Accepted'] },
  });
});

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
  await request(app)
    .post('/submit-project')
    .set('Authorization', authorizationFor(freelancer))
    .send({
      projectId: project._id.toString(),
      projectLink: 'https://example.com/second-project',
      manualLink: 'https://example.com/second-manual',
      submissionDescription: 'This replacement must be rejected while review is pending.',
    })
    .expect(409);
  await request(app).get(`/approve-submission/${project._id}`).set('Authorization', clientAuth).expect(200);

  const completed = await Project.findById(project._id);
  const freelancerProfile = await Freelancer.findOne({ user: freelancer._id });
  assert.equal(completed.status, 'Completed');
  assert.equal(completed.submissionAccepted, true);
  assert.equal(freelancerProfile.funds, 750);
  assert.equal(completed.projectLink, 'https://example.com/project');
  await request(app)
    .post('/submit-project')
    .set('Authorization', authorizationFor(freelancer))
    .send({
      projectId: project._id.toString(),
      projectLink: 'https://example.com/overwrite',
      manualLink: 'https://example.com/overwrite-manual',
      submissionDescription: 'This must not overwrite an accepted submission.',
    })
    .expect(409);
  assert.equal((await Project.findById(project._id)).projectLink, 'https://example.com/project');
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

test('allows reapplication after rejection while preserving application history', async () => {
  const client = await createUser({ username: 'Client', email: 'reapply-client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'reapply-freelancer@example.com', usertype: 'freelancer' });
  const project = await Project.create({
    ...projectPayload,
    client: client._id,
    clientName: client.username,
    clientEmail: client.email,
    postedDate: new Date().toISOString(),
  });
  const bid = {
    projectId: project._id.toString(),
    proposal: 'I can deliver the project with a reliable implementation.',
    bidAmount: 800,
    estimatedTime: 10,
  };
  const freelancerAuth = authorizationFor(freelancer);

  await request(app).post('/make-bid').set('Authorization', freelancerAuth).send(bid).expect(200);
  await request(app).post('/make-bid').set('Authorization', freelancerAuth).send(bid).expect(409);

  const firstApplication = await Application.findOne({ project: project._id, freelancer: freelancer._id });
  await request(app).get(`/reject-application/${firstApplication._id}`).set('Authorization', authorizationFor(client)).expect(200);
  assert.equal((await Application.findById(firstApplication._id)).status, 'Rejected');

  const reapplicationResponses = await Promise.all([
    request(app).post('/make-bid').set('Authorization', freelancerAuth).send(bid),
    request(app).post('/make-bid').set('Authorization', freelancerAuth).send({ ...bid, proposal: 'I can also complete this with a tested delivery.' }),
  ]);
  assert.deepEqual(reapplicationResponses.map((response) => response.status).sort(), [200, 409]);
  assert.equal(await Application.countDocuments({ project: project._id, freelancer: freelancer._id }), 2);
  assert.equal(await Application.countDocuments({ project: project._id, freelancer: freelancer._id, status: 'Rejected' }), 1);
  assert.equal(await Application.countDocuments({ project: project._id, freelancer: freelancer._id, status: 'Pending' }), 1);

  const pendingApplication = await Application.findOne({ project: project._id, freelancer: freelancer._id, status: 'Pending' });
  await request(app).get(`/approve-application/${pendingApplication._id}`).set('Authorization', authorizationFor(client)).expect(200);
  await request(app).post('/make-bid').set('Authorization', freelancerAuth).send(bid).expect(409);

  const closedProject = await Project.create({ ...projectPayload, client: client._id, status: 'Completed', postedDate: new Date().toISOString() });
  await request(app)
    .post('/make-bid')
    .set('Authorization', freelancerAuth)
    .send({ ...bid, projectId: closedProject._id.toString() })
    .expect(409);
});

test('allows a revised submission after client rejection and protects authorization', async () => {
  const client = await createUser({ username: 'Client', email: 'submission-client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'submission-freelancer@example.com', usertype: 'freelancer' });
  const outsider = await createUser({ username: 'Outsider', email: 'submission-outsider@example.com', usertype: 'freelancer' });
  const project = await Project.create({
    ...projectPayload,
    client: client._id,
    freelancer: freelancer._id,
    clientName: client.username,
    clientEmail: client.email,
    postedDate: new Date().toISOString(),
    status: 'Assigned',
  });
  const firstSubmission = {
    projectId: project._id.toString(),
    projectLink: 'https://example.com/first',
    manualLink: 'https://example.com/first-manual',
    submissionDescription: 'First version awaiting review.',
  };

  await request(app).post('/submit-project').set('Authorization', authorizationFor(outsider)).send(firstSubmission).expect(403);
  await request(app).post('/submit-project').set('Authorization', authorizationFor(freelancer)).send(firstSubmission).expect(200);
  await request(app).get(`/reject-submission/${project._id}`).set('Authorization', authorizationFor(client)).expect(200);
  assert.equal((await Project.findById(project._id)).submission, false);

  await request(app).post('/submit-project').set('Authorization', authorizationFor(freelancer)).send({
    ...firstSubmission,
    projectLink: 'https://example.com/revised',
    manualLink: 'https://example.com/revised-manual',
    submissionDescription: 'Revised version after client feedback.',
  }).expect(200);
  const revised = await Project.findById(project._id);
  assert.equal(revised.projectLink, 'https://example.com/revised');
  assert.equal(revised.submissionDescription, 'Revised version after client feedback.');

  await request(app).post('/submit-project').set('Authorization', authorizationFor(freelancer)).send({
    ...firstSubmission,
    projectLink: 'https://example.com/concurrent-a',
  }).expect(409);
});

test('allows only one concurrent submission rejection to succeed', async () => {
  const client = await createUser({ username: 'Reject Client', email: 'reject-client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Reject Freelancer', email: 'reject-freelancer@example.com', usertype: 'freelancer' });
  const project = await Project.create({
    ...projectPayload,
    client: client._id,
    freelancer: freelancer._id,
    clientName: client.username,
    clientEmail: client.email,
    postedDate: new Date().toISOString(),
    status: 'Assigned',
    submission: true,
    projectLink: 'https://example.com/submission',
    manualLink: 'https://example.com/manual',
    submissionDescription: 'A submitted project awaiting the client decision.',
  });

  const responses = await Promise.all([
    request(app).get(`/reject-submission/${project._id}`).set('Authorization', authorizationFor(client)),
    request(app).get(`/reject-submission/${project._id}`).set('Authorization', authorizationFor(client)),
  ]);

  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  const rejected = await Project.findById(project._id);
  assert.equal(rejected.submission, false);
  assert.equal(rejected.projectLink, '');
});

test('rejects missing projects and concurrent first submissions safely', async () => {
  const client = await createUser({ username: 'Client', email: 'concurrent-client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'concurrent-freelancer@example.com', usertype: 'freelancer' });
  const project = await Project.create({
    ...projectPayload,
    client: client._id,
    freelancer: freelancer._id,
    clientName: client.username,
    clientEmail: client.email,
    postedDate: new Date().toISOString(),
    status: 'Assigned',
  });
  const authorization = authorizationFor(freelancer);
  const submission = {
    projectId: project._id.toString(),
    projectLink: 'https://example.com/concurrent',
    manualLink: 'https://example.com/concurrent-manual',
    submissionDescription: 'Only one concurrent submission may win.',
  };

  await request(app).post('/submit-project').set('Authorization', authorization).send({ ...submission, projectId: '507f1f77bcf86cd799439011' }).expect(404);
  const responses = await Promise.all([
    request(app).post('/submit-project').set('Authorization', authorization).send(submission),
    request(app).post('/submit-project').set('Authorization', authorization).send({ ...submission, projectLink: 'https://example.com/concurrent-b' }),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.equal((await Project.findById(project._id)).submission, true);
});

test('does not allow concurrent approval and rejection to both succeed', async () => {
  const client = await createUser({ username: 'Decision Client', email: 'decision-client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Decision Freelancer', email: 'decision-freelancer@example.com', usertype: 'freelancer' });
  const project = await Project.create({
    ...projectPayload,
    client: client._id,
    clientName: client.username,
    clientEmail: client.email,
    postedDate: new Date().toISOString(),
  });
  await request(app).post('/make-bid').set('Authorization', authorizationFor(freelancer)).send({
    projectId: project._id.toString(),
    proposal: 'I can complete this project with a clear delivery plan.',
    bidAmount: 700,
    estimatedTime: 8,
  }).expect(200);
  const application = await Application.findOne({ project: project._id, freelancer: freelancer._id });

  const responses = await Promise.all([
    request(app).get(`/approve-application/${application._id}`).set('Authorization', authorizationFor(client)),
    request(app).get(`/reject-application/${application._id}`).set('Authorization', authorizationFor(client)),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.ok(['Accepted', 'Rejected'].includes((await Application.findById(application._id)).status));
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

test('rolls back project completion when freelancer credit no longer matches a profile', async () => {
  const client = await createUser({ username: 'Client', email: 'missing-credit-client@example.com', usertype: 'client' });
  const freelancer = await createUser({ username: 'Freelancer', email: 'missing-credit-freelancer@example.com', usertype: 'freelancer' });
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
  Freelancer.updateOne = async () => ({ modifiedCount: 0 });
  try {
    await assert.rejects(approveSubmissionService(project._id.toString(), client), /freelancer account is no longer available/);
  } finally {
    Freelancer.updateOne = originalUpdateOne;
  }

  const persistedProject = await Project.findById(project._id);
  const profile = await Freelancer.findOne({ user: freelancer._id });
  assert.equal(persistedProject.status, 'Assigned');
  assert.equal(persistedProject.submissionAccepted, false);
  assert.equal(profile.funds, 0);
});
