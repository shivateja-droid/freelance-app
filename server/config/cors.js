const productionOriginPattern = /^https:\/\/[^/]+$/;
const localDevelopmentOrigin = 'http://localhost:5173';

export const parseClientOrigins = (value = '', { allowLocalOrigin = false } = {}) => {
  const origins = value.split(',').map((origin) => origin.trim()).filter(Boolean);

  for (const origin of origins) {
    if (allowLocalOrigin && origin === localDevelopmentOrigin) continue;
    if (!productionOriginPattern.test(origin)) {
      throw new Error('CLIENT_ORIGINS must contain comma-separated HTTPS origins without paths or trailing slashes');
    }
  }

  if (allowLocalOrigin) origins.push(localDevelopmentOrigin);

  return new Set(origins);
};

export const createOriginPolicy = (origins) => ({
  origins,
  allows: (origin) => !origin || origins.has(origin),
});

export { localDevelopmentOrigin };

