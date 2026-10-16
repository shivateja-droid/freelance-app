import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { fileURLToPath } from 'url';
import pinoHttp from 'pino-http';
import { Server } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import connectDB from './config/db.js';
import openapi from './docs/openapi.js';
import adminRoutes from './routes/adminRoutes.js';
import applicationRoutes from './routes/applicationRoutes.js';
import authRoutes from './routes/authRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import freelancerRoutes from './routes/freelancerRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import SocketHandler from './SocketHandler.js';
import { authenticateToken } from './middleware/authMiddleware.js';
import { databaseHealth } from './observability/health.js';
import { createRequestId, logger, logError } from './observability/logger.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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

app.get("/", (req, res) => {
  res.json({ message: "KaamSetu Backend Live 🚀" });
});

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());

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

app.use(authRoutes);
app.use(freelancerRoutes);
app.use(projectRoutes);
app.use(applicationRoutes);
app.use(adminRoutes);
app.use(chatRoutes);

app.use((error, req, res, next) => {
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
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
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



const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    await connectDB();
    server.listen(PORT, () => {
      logger.info({ event: 'server_started', port: Number(PORT) }, 'KaamSetu server started');
    });
  } catch (error) {
    logger.error({ err: error, event: 'server_start_failed' }, 'KaamSetu server failed to start');
  }
};

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  startServer();
}

export { app, io, server, startServer };
