import jwt from 'jsonwebtoken';
import { User } from '../Schema.js';
import { logger } from '../observability/logger.js';

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.status = 500;
    throw error;
  }

  return process.env.JWT_SECRET;
};

const unauthorized = (message = 'Authentication required') => {
  const error = new Error(message);
  error.status = 401;
  return error;
};

export const authenticateToken = async (token) => {
  if (!token) {
    throw unauthorized();
  }

  const secret = getJwtSecret();
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    throw unauthorized('Invalid or expired authentication token');
  }

  const user = await User.findById(payload.sub).select('_id username email usertype');
  if (!user) {
    throw unauthorized('User account no longer exists');
  }

  return user;
};

export const requireAuth = async (req, res, next) => {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;

  try {
    req.user = await authenticateToken(token);
    return next();
  } catch (error) {
    (req.log || logger).warn({
      event: 'authentication_failed',
      requestId: req.id,
      method: req.method,
      route: req.path,
      reason: error.message,
    }, 'Authentication failed');
    return res.status(error.status || 401).json({ error: error.message });
  }
};

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.usertype)) {
    (req.log || logger).warn({
      event: 'authorization_denied',
      requestId: req.id,
      method: req.method,
      route: req.path,
      requiredRoles: roles,
    }, 'Authorization denied');
    return res.status(403).json({ error: 'You are not authorized to perform this action' });
  }

  return next();
};
