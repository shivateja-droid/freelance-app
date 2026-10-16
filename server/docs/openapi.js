const objectIdExample = '507f1f77bcf86cd799439011';

const messageResponse = (message, description = 'Operation completed.') => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/MessageResponse' },
      example: { message },
    },
  },
});

const errorResponse = (description, example) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
      example: { error: example },
    },
  },
});

const validationError = {
  description: 'Request body or path parameters do not satisfy the Zod validation schema.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ValidationError' },
      example: {
        error: 'Invalid request data',
        details: [{ field: 'title', message: 'Title must be at least 3 characters' }],
      },
    },
  },
};

const bearerAuth = [{ bearerAuth: [] }];
const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'MongoDB ObjectId.',
  schema: { $ref: '#/components/schemas/ObjectId' },
  example: objectIdExample,
};

const openapi = {
  openapi: '3.1.0',
  info: {
    title: 'KaamSetu API',
    version: '1.0.0',
    description: 'HTTP API for the KaamSetu freelance marketplace. Input validation is enforced by the server-side Zod schemas. Socket.IO is documented separately in `docs/socket-io.md`.',
  },
  servers: [{ url: 'http://localhost:3001', description: 'Local development server' }],
  tags: [
    { name: 'Authentication' },
    { name: 'Projects' },
    { name: 'Applications' },
    { name: 'Freelancers' },
    { name: 'Chat' },
    { name: 'Administration' },
    { name: 'Health' },
  ],
  paths: {
    '/': {
      get: {
        tags: ['Authentication'],
        summary: 'Backend health message',
        responses: {
          200: { description: 'Backend is reachable.', content: { 'application/json': { schema: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } }, example: { message: 'KaamSetu Backend Live' } } } },
        },
      },
    },
    '/health/live': {
      get: {
        tags: ['Health'],
        summary: 'Process liveness check',
        description: 'Reports that the HTTP service is running. It does not check MongoDB connectivity.',
        responses: {
          200: { description: 'The process is live.', content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { const: 'ok' } } }, example: { status: 'ok' } } } },
        },
      },
    },
    '/health/ready': {
      get: {
        tags: ['Health'],
        summary: 'Service readiness check',
        description: 'Reports whether MongoDB is connected. It never exposes connection strings or credentials.',
        responses: {
          200: { description: 'The service is ready to serve database-backed requests.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Readiness' }, example: { status: 'ready', database: 'connected' } } } },
          503: { description: 'The process is live but MongoDB is not ready.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Readiness' }, example: { status: 'not_ready', database: 'disconnected' } } } },
        },
      },
    },
    '/register': {
      post: {
        tags: ['Authentication'], summary: 'Register a client or freelancer account',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' }, example: { username: 'Asha Client', email: 'asha@example.test', password: 'ExamplePass123', usertype: 'client' } } } },
        responses: { 200: { $ref: '#/components/responses/AuthSuccess' }, 400: validationError, 403: errorResponse('Public registration never creates administrators.', 'Admin accounts cannot be created through public registration') },
      },
    },
    '/login': {
      post: {
        tags: ['Authentication'], summary: 'Log in and receive a JWT',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' }, example: { email: 'asha@example.test', password: 'ExamplePass123' } } } },
        responses: { 200: { $ref: '#/components/responses/AuthSuccess' }, 400: { description: 'Invalid input, unknown email, or invalid password. The current implementation uses `msg` for credential failures.', content: { 'application/json': { schema: { oneOf: [{ $ref: '#/components/schemas/ValidationError' }, { $ref: '#/components/schemas/LoginError' }] }, examples: { invalidRequest: { value: { error: 'Invalid request data', details: [{ field: 'email', message: 'Email must be valid' }] } }, invalidCredentials: { value: { msg: 'Invalid credentials' } } } } } } },
      },
    },
    '/me': {
      get: {
        tags: ['Authentication'], summary: 'Get the authenticated user', security: bearerAuth,
        responses: { 200: { description: 'Current safe user fields.', content: { 'application/json': { schema: { type: 'object', required: ['user'], properties: { user: { $ref: '#/components/schemas/User' } } } } } }, 401: { $ref: '#/components/responses/AuthenticationError' } },
      },
    },
    '/fetch-users': {
      get: {
        tags: ['Administration'], summary: 'List users', description: 'Administrator only.', security: bearerAuth,
        responses: { 200: { description: 'Users without password hashes.', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } }, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: { $ref: '#/components/responses/RoleError' } },
      },
    },
    '/fetch-projects': {
      get: {
        tags: ['Projects'], summary: 'List projects', security: bearerAuth,
        responses: { 200: { description: 'All projects.', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Project' } } } } }, 401: { $ref: '#/components/responses/AuthenticationError' } },
      },
    },
    '/fetch-project/{id}': {
      get: {
        tags: ['Projects'], summary: 'Get a project by id', security: bearerAuth, parameters: [idParameter],
        responses: { 200: { description: 'Project, or `null` when no project exists for a valid id.', content: { 'application/json': { schema: { anyOf: [{ $ref: '#/components/schemas/Project' }, { type: 'null' }] } } } }, 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' } },
      },
    },
    '/new-project': {
      post: {
        tags: ['Projects'], summary: 'Create a project', description: 'Client only. The owner and initial status are server-controlled.', security: bearerAuth,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateProjectRequest' }, example: { title: 'Build an inventory dashboard', description: 'Create a responsive dashboard with authenticated reporting views.', budget: 18000, skills: 'React,Node.js,MongoDB' } } } },
        responses: { 200: messageResponse('Project added'), 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: { $ref: '#/components/responses/RoleError' } },
      },
    },
    '/submit-project': {
      post: {
        tags: ['Projects'], summary: 'Submit assigned work', description: 'Freelancer only. The freelancer must be assigned to the project.', security: bearerAuth,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SubmitProjectRequest' }, example: { projectId: objectIdExample, projectLink: 'https://example.test/project', manualLink: 'https://example.test/manual', submissionDescription: 'The requested dashboard and setup notes are complete.' } } } },
        responses: { 200: messageResponse('Project added', 'The current implementation returns this legacy success message after submission.'), 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: errorResponse('The authenticated freelancer is not assigned to the project.', 'You are not assigned to this project'), 404: errorResponse('Project does not exist.', 'Project not found') },
      },
    },
    '/approve-submission/{id}': {
      get: {
        tags: ['Projects'], summary: 'Approve a project submission', description: 'Client only and limited to the project owner. Completion and funds credit are processed transactionally.', security: bearerAuth, parameters: [idParameter],
        responses: { 200: messageResponse('submission approved'), 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: errorResponse('The caller does not own the project.', 'You do not own this project'), 404: errorResponse('Project or assigned freelancer does not exist.', 'Project not found'), 409: errorResponse('The submission was already processed or is not eligible.', 'This submission has already been processed') },
      },
    },
    '/reject-submission/{id}': {
      get: {
        tags: ['Projects'], summary: 'Reject a project submission', description: 'Client only and limited to the project owner. This clears the stored submission fields.', security: bearerAuth, parameters: [idParameter],
        responses: { 200: messageResponse('submission approved', 'The current implementation returns this legacy success message after rejection.'), 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: errorResponse('The caller does not own the project.', 'You do not own this project'), 404: errorResponse('Project does not exist.', 'Project not found') },
      },
    },
    '/make-bid': {
      post: {
        tags: ['Applications'], summary: 'Create a bid', description: 'Freelancer only. The client, freelancer, and project references are server-controlled.', security: bearerAuth,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateBidRequest' }, example: { projectId: objectIdExample, proposal: 'I can deliver the dashboard with clear handover notes and tested API integration.', bidAmount: 16000, estimatedTime: 14 } } } },
        responses: { 200: messageResponse('bidding successful'), 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: { $ref: '#/components/responses/RoleError' }, 404: errorResponse('Required project, client, or freelancer data is unavailable.', 'Unable to create bid with the provided data'), 409: errorResponse('The project is unavailable or this freelancer already has an application.', 'You have already applied to this project') },
      },
    },
    '/fetch-applications': {
      get: {
        tags: ['Applications'], summary: 'List applications visible to the caller', description: 'Clients receive applications for their projects, freelancers receive their applications, and administrators receive all applications.', security: bearerAuth,
        responses: { 200: { description: 'Applications.', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Application' } } } } }, 401: { $ref: '#/components/responses/AuthenticationError' } },
      },
    },
    '/approve-application/{id}': {
      get: {
        tags: ['Applications'], summary: 'Accept an application', description: 'Client only and limited to the owner of the application project. Accepting a bid assigns the project and rejects competing pending applications transactionally.', security: bearerAuth, parameters: [idParameter],
        responses: { 200: messageResponse('Application approved!!'), 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: errorResponse('The caller does not own the application project.', 'You do not own this project'), 404: errorResponse('Application, project, freelancer profile, or freelancer user does not exist.', 'Application not found'), 409: errorResponse('Only a pending bid for an available project may be accepted.', 'Project is no longer available') },
      },
    },
    '/reject-application/{id}': {
      get: {
        tags: ['Applications'], summary: 'Reject an application', description: 'Client only and limited to the owner of the application project.', security: bearerAuth, parameters: [idParameter],
        responses: { 200: messageResponse('Application rejected!!'), 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: errorResponse('The caller does not own the application project.', 'You do not own this project'), 404: errorResponse('Application or project does not exist.', 'Application not found'), 409: errorResponse('Only a pending application can be rejected.', 'Only pending applications can be rejected') },
      },
    },
    '/fetch-freelancer/{id}': {
      get: {
        tags: ['Freelancers'], summary: 'Get a freelancer profile', description: 'Freelancer or administrator role required. A freelancer may only retrieve their own profile.', security: bearerAuth, parameters: [idParameter],
        responses: { 200: { description: 'Freelancer profile, or `null` when the profile is absent for a valid user id.', content: { 'application/json': { schema: { anyOf: [{ $ref: '#/components/schemas/Freelancer' }, { type: 'null' }] } } } }, 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: errorResponse('Role is not permitted or a freelancer requested another user profile.', 'You can only view your own freelancer profile') },
      },
    },
    '/update-freelancer': {
      post: {
        tags: ['Freelancers'], summary: 'Update the authenticated freelancer profile', description: 'Freelancer only. Profile ownership and funds are server-controlled.', security: bearerAuth,
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateFreelancerRequest' }, example: { updateSkills: 'React,Node.js,MongoDB', description: 'Full-stack freelancer focused on marketplace applications.' } } } },
        responses: { 200: { description: 'Updated freelancer profile.', content: { 'application/json': { schema: { $ref: '#/components/schemas/Freelancer' } } } }, 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: { $ref: '#/components/responses/RoleError' }, 404: errorResponse('No freelancer profile exists for the authenticated user.', 'Freelancer not found') },
      },
    },
    '/fetch-chats/{id}': {
      get: {
        tags: ['Chat'], summary: 'Get a project chat', description: 'Available to the project client, assigned freelancer, or administrator. A chat record is created by Socket.IO actions, so this can return `null`.', security: bearerAuth, parameters: [idParameter],
        responses: { 200: { description: 'Project chat, or `null` when no chat has been created yet.', content: { 'application/json': { schema: { anyOf: [{ $ref: '#/components/schemas/Chat' }, { type: 'null' }] } } } }, 400: validationError, 401: { $ref: '#/components/responses/AuthenticationError' }, 403: errorResponse('Caller is not a project participant, or the project does not exist.', 'You are not allowed to view this chat') },
      },
    },
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'JWT returned by `/register` or `/login`.' } },
    responses: {
      AuthenticationError: errorResponse('Missing, invalid, expired, or revoked authentication token.', 'Authentication required'),
      RoleError: errorResponse('Authenticated user lacks the required role.', 'You are not authorized to perform this action'),
      ValidationError: validationError,
    },
    schemas: {
      ObjectId: { type: 'string', pattern: '^[a-fA-F0-9]{24}$', example: objectIdExample },
      User: { type: 'object', required: ['_id', 'username', 'email', 'usertype'], properties: { _id: { $ref: '#/components/schemas/ObjectId' }, username: { type: 'string', example: 'Asha Client' }, email: { type: 'string', format: 'email', example: 'asha@example.test' }, usertype: { type: 'string', enum: ['client', 'freelancer', 'admin'], example: 'client' } } },
      AuthResponse: { type: 'object', required: ['token', 'user'], properties: { token: { type: 'string', description: 'JWT valid for 12 hours.', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.signature' }, user: { $ref: '#/components/schemas/User' } } },
      LoginError: { type: 'object', required: ['msg'], properties: { msg: { type: 'string', example: 'Invalid credentials' } } },
      ErrorResponse: { type: 'object', required: ['error'], properties: { error: { type: 'string' } } },
      ValidationError: { type: 'object', required: ['error', 'details'], properties: { error: { const: 'Invalid request data' }, details: { type: 'array', items: { type: 'object', required: ['field', 'message'], properties: { field: { type: 'string' }, message: { type: 'string' } } } } } },
      MessageResponse: { type: 'object', required: ['message'], properties: { message: { type: 'string' } } },
      Readiness: { type: 'object', required: ['status', 'database'], properties: { status: { type: 'string', enum: ['ready', 'not_ready'] }, database: { type: 'string', enum: ['connected', 'connecting', 'disconnecting', 'disconnected', 'unknown'] } } },
      RegisterRequest: { type: 'object', additionalProperties: false, required: ['username', 'email', 'password', 'usertype'], properties: { username: { type: 'string', minLength: 3, maxLength: 50 }, email: { type: 'string', format: 'email', maxLength: 254 }, password: { type: 'string', minLength: 8, maxLength: 128, writeOnly: true }, usertype: { type: 'string', enum: ['client', 'freelancer'] } } },
      LoginRequest: { type: 'object', additionalProperties: false, required: ['email', 'password'], properties: { email: { type: 'string', format: 'email', maxLength: 254 }, password: { type: 'string', minLength: 1, maxLength: 128, writeOnly: true } } },
      CreateProjectRequest: { type: 'object', additionalProperties: false, required: ['title', 'description', 'budget', 'skills'], properties: { title: { type: 'string', minLength: 3, maxLength: 120 }, description: { type: 'string', minLength: 10, maxLength: 5000 }, budget: { type: 'number', exclusiveMinimum: 0, maximum: 10000000 }, skills: { $ref: '#/components/schemas/SkillsInput' } } },
      CreateBidRequest: { type: 'object', additionalProperties: false, required: ['projectId', 'proposal', 'bidAmount', 'estimatedTime'], properties: { projectId: { $ref: '#/components/schemas/ObjectId' }, proposal: { type: 'string', minLength: 10, maxLength: 5000 }, bidAmount: { type: 'number', exclusiveMinimum: 0, maximum: 10000000 }, estimatedTime: { type: 'integer', minimum: 1, maximum: 3650, description: 'Estimated time in days.' } } },
      SubmitProjectRequest: { type: 'object', additionalProperties: false, required: ['projectId', 'projectLink', 'manualLink', 'submissionDescription'], properties: { projectId: { $ref: '#/components/schemas/ObjectId' }, projectLink: { $ref: '#/components/schemas/HttpUrl' }, manualLink: { $ref: '#/components/schemas/HttpUrl' }, submissionDescription: { type: 'string', minLength: 10, maxLength: 5000 } } },
      UpdateFreelancerRequest: { type: 'object', additionalProperties: false, required: ['updateSkills', 'description'], properties: { updateSkills: { $ref: '#/components/schemas/SkillsInput' }, description: { type: 'string', maxLength: 2000 } } },
      SkillsInput: { type: 'string', minLength: 1, maxLength: 1000, description: 'One to 20 comma-separated non-empty skill names, each no more than 50 characters.', example: 'React,Node.js,MongoDB' },
      HttpUrl: { type: 'string', format: 'uri', maxLength: 2048, pattern: '^https?://', example: 'https://example.test/resource' },
      Project: { type: 'object', description: 'Mongoose project document. `_id` and `__v` are included by current responses.', properties: { _id: { $ref: '#/components/schemas/ObjectId' }, client: { $ref: '#/components/schemas/ObjectId' }, freelancer: { $ref: '#/components/schemas/ObjectId' }, clientName: { type: 'string' }, clientEmail: { type: 'string', format: 'email' }, title: { type: 'string' }, description: { type: 'string' }, budget: { type: 'number' }, skills: { type: 'array', items: { type: 'string' } }, postedDate: { type: 'string' }, status: { type: 'string', example: 'Available' }, freelancerName: { type: 'string' }, deadline: { type: 'string' }, submission: { type: 'boolean' }, submissionAccepted: { type: 'boolean' }, projectLink: { type: 'string' }, manualLink: { type: 'string' }, submissionDescription: { type: 'string' }, __v: { type: 'integer' } } },
      Application: { type: 'object', description: 'Mongoose application document. Snapshot fields describe the project and users at bid time.', properties: { _id: { $ref: '#/components/schemas/ObjectId' }, project: { $ref: '#/components/schemas/ObjectId' }, client: { $ref: '#/components/schemas/ObjectId' }, freelancer: { $ref: '#/components/schemas/ObjectId' }, clientName: { type: 'string' }, clientEmail: { type: 'string', format: 'email' }, freelancerName: { type: 'string' }, freelancerEmail: { type: 'string', format: 'email' }, freelancerSkills: { type: 'array', items: { type: 'string' } }, title: { type: 'string' }, description: { type: 'string' }, budget: { type: 'number' }, requiredSkills: { type: 'array', items: { type: 'string' } }, proposal: { type: 'string' }, bidAmount: { type: 'number' }, estimatedTime: { type: 'number' }, status: { type: 'string', example: 'Pending' }, __v: { type: 'integer' } } },
      Freelancer: { type: 'object', description: 'Mongoose freelancer profile document. `_id` is the profile id; `user` is its owner.', properties: { _id: { $ref: '#/components/schemas/ObjectId' }, user: { $ref: '#/components/schemas/ObjectId' }, skills: { type: 'array', items: { type: 'string' } }, description: { type: 'string' }, funds: { type: 'number' }, __v: { type: 'integer' } } },
      ChatMessage: { type: 'object', properties: { id: { type: 'string', format: 'uuid' }, text: { type: 'string' }, sender: { $ref: '#/components/schemas/ObjectId' }, time: { description: 'Date value serialized by Mongoose.', type: 'string' } } },
      Chat: { type: 'object', description: 'Mongoose chat document. The chat id is a UUID string; `project` is the canonical project relationship.', properties: { _id: { type: 'string', format: 'uuid' }, project: { $ref: '#/components/schemas/ObjectId' }, messages: { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } }, __v: { type: 'integer' } } },
    },
  },
};

openapi.components.responses.AuthSuccess = {
  description: 'Authenticated user and JWT.',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/AuthResponse' },
      example: { token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example.signature', user: { _id: objectIdExample, username: 'Asha Client', email: 'asha@example.test', usertype: 'client' } },
    },
  },
};

export default openapi;
