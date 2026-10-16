import { randomUUID } from 'crypto';
import pino from 'pino';

const sensitivePaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.passwordHash',
  'req.body.token',
  'req.body.authorization',
  'authorization',
  'token',
  'password',
  'passwordHash',
  'mongoUri',
  'uri',
  'connectionString',
];

const isDevelopment = process.env.NODE_ENV === 'development';
const usePrettyLogs = isDevelopment || process.env.LOG_PRETTY === 'true';

export const loggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: sensitivePaths,
    censor: '[Redacted]',
  },
  base: { service: 'kaamsetu-api' },
  ...(usePrettyLogs ? {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, singleLine: true, translateTime: 'SYS:standard' },
    },
  } : {}),
};

export const logger = pino(loggerOptions);

export const createRequestId = (requestId) => (
  typeof requestId === 'string' && /^[A-Za-z0-9_-]{8,128}$/.test(requestId)
    ? requestId
    : randomUUID()
);

export const logError = (request, error, message = 'Request failed') => {
  const loggerForRequest = request?.log || logger;
  loggerForRequest.error({
    err: error,
    requestId: request?.id,
    method: request?.method,
    route: request?.route?.path || request?.path,
  }, message);
};
