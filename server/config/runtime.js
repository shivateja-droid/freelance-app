import { createOriginPolicy, parseClientOrigins } from './cors.js';

const supportedEnvironments = new Set(['development', 'test', 'production']);

export const resolveRuntimeConfig = (environment = process.env) => {
  const nodeEnv = environment.NODE_ENV;
  if (!supportedEnvironments.has(nodeEnv)) {
    throw new Error('NODE_ENV must be one of development, test, or production');
  }

  const allowLocalOrigin = nodeEnv === 'development' && environment.ALLOW_LOCAL_ORIGIN === 'true';
  const origins = parseClientOrigins(environment.CLIENT_ORIGINS, { allowLocalOrigin });

  if (nodeEnv === 'production') {
    const missing = ['JWT_SECRET', 'MONGO_URI', 'CLIENT_ORIGINS']
      .filter((name) => !environment[name]?.trim());
    if (missing.length > 0) {
      throw new Error(`Missing required production configuration: ${missing.join(', ')}`);
    }
    if (environment.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
    if (origins.size === 0) {
      throw new Error('CLIENT_ORIGINS must contain at least one origin in production');
    }
  }

  return {
    nodeEnv,
    allowLocalOrigin,
    clientOriginPolicy: createOriginPolicy(origins),
  };
};