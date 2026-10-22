import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import http from 'http';
import { fileURLToPath } from 'url';
import pinoHttp from 'pino-http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import connectDB, { disconnectDB } from './config/db.js';
import { createShutdownHandler } from './config/shutdown.js';
import { resolveRuntimeConfig } from './config/runtime.js';
import openapi from './docs/openapi.js';
import adminRoutes from './routes/adminRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import SocketHandler, { stopChatMessageRateLimiter } from './SocketHandler.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import { databaseHealth } from './observability/health.js';
import { createRequestId, logger, logError } from './observability/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const { clientOriginPolicy } = resolveRuntimeConfig(process.env);
const rateLimitResponse = (_req, res) => res.status(429).json({ error: 'Too many requests, please try again later' });

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitResponse,
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitResponse,
});

const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitResponse,
});

const requestRoute = (req) => (req.route?.path ? `${req.baseUrl || ''}${req.route.path}` : req.path);

app.use(pinoHttp({
  logger,
  genReqId: (req, res) => {
    const requestId = createRequestId(req.headers['x-request-id']);
    res.setHeader('X-Request-Id', requestId);
    return requestId;
  },
  customLogLevel: (_req, res, error) => {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessObject: (req, res, logData) => ({
    requestId: req.id,
    method: req.method,
    route: requestRoute(req),
    statusCode: res.statusCode,
    durationMs: logData.responseTime,
  }),
  // Health probes can be frequent; readiness is exposed through its response rather than per-probe logs.
  autoLogging: { ignore: (req) => req.path === '/health/live' || req.path === '/health/ready' },
}));

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (clientOriginPolicy.allows(origin)) return next();

  (req.log || logger).warn({ event: 'cors_origin_rejected', requestId: req.id, origin }, 'CORS origin rejected');
  return res.status(403).json({ error: 'Origin not allowed' });
});

app.use(cors({
  origin: (origin, callback) => callback(null, clientOriginPolicy.allows(origin)),
}));

app.get("/", (req, res) => {
  res.json({ message: "KaamSetu Backend Live 🚀" });
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '100kb', extended: true, parameterLimit: 1_000 }));

app.get('/health/live', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/health/ready', (_req, res) => {
  const database = databaseHealth();
  return res.status(database.connected ? 200 : 503).json({
    status: database.connected ? 'ready' : 'not_ready',
    database: database.state,
  });
});

app.get('/api-docs/openapi.json', (_req, res) => res.status(200).json(openapi));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, {
  customSiteTitle: 'KaamSetu API Reference',
}));

app.use('/register', registrationLimiter);
app.use('/login', authLimiter);
app.use('/new-project', mutationLimiter);
app.use('/make-bid', mutationLimiter);
app.use(authRoutes);
app.use(freelancerRoutes);
app.use(projectRoutes);
app.use(applicationRoutes);
app.use(adminRoutes);
app.use(chatRoutes);

app.use((error, req, res, next) => {
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid request data', details: [{ field: 'body', message: 'Malformed JSON body' }] });
  }
  logError(req, error, 'Unhandled request error');
  if (!res.headersSent) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  return next(error);
});

const server = http.createServer(app);

const io = new Server(server, {
  maxHttpBufferSize: 1e6,
  cors: {
    origin: (origin, callback) => callback(null, clientOriginPolicy.allows(origin)),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
  allowRequest: (request, callback) => {
    const origin = request.headers.origin;
    if (clientOriginPolicy.allows(origin)) return callback(null, true);
    logger.warn({ event: 'socket_origin_rejected', origin }, 'Socket origin rejected');
    return callback('Origin not allowed', false);
  },
});

io.use(async (socket, next) => {
  try {
    socket.user = await authenticateToken(socket.handshake.auth?.token);
    return next();
  } catch {
    logger.warn({ event: 'socket_authentication_failed', socketId: socket.id }, 'Socket authentication failed');
    return next(new Error('Authentication required'));
  }
});

io.on('connection', (socket) => {
  logger.info({ event: 'socket_connected', socketId: socket.id, usertype: socket.user.usertype }, 'Socket connected');
  SocketHandler(socket);
});

const closeHttpServer = () => {
  if (!server.listening) return Promise.resolve();
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
};

const closeSocketServer = () => new Promise((resolve, reject) => {
  try {
    io.close((error) => (error ? reject(error) : resolve()));
  } catch (error) {
    reject(error);
  }
});

const shutdownServer = createShutdownHandler({
  stopAccepting: closeHttpServer,
  closeSocket: async () => {
    stopChatMessageRateLimiter();
    await closeSocketServer();
  },
  disconnectDatabase: disconnectDB,
  logger,
});

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info({ event: 'server_started', port: Number(PORT) }, 'KaamSetu server started');
    });
    return server;
  } catch (error) {
    logger.error({ err: error, event: 'server_start_failed' }, 'KaamSetu server failed to start');
    throw error;
  }
};

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  startServer().catch(() => {
    process.exitCode = 1;
  });
  const handleSignal = (signal) => {
    shutdownServer(signal).then((result) => {
      if (result.status !== 'completed') process.exitCode = 1;
    });
  };
  process.once('SIGTERM', () => handleSignal('SIGTERM'));
  process.once('SIGINT', () => handleSignal('SIGINT'));
}

export { app, io, server, startServer, shutdownServer };
