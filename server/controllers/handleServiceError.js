export const handleServiceError = (res, error) => {
  const status = error.status || 500;
  const responseKey = error.responseKey || 'error';

  return res.status(status).json({ [responseKey]: error.message });
};
