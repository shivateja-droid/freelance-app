import { logError } from '../observability/logger.js';

export const handleServiceError = (req, res, error) => {
  const status = error.status || 500;
  if (status >= 500) {
    logError(req, error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  const responseKey = error.responseKey || 'error';
  return res.status(status).json({ [responseKey]: error.message });
};
