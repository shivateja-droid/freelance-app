export const validate = (schema, location = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[location]);
  if (!result.success) {
    return res.status(400).json({
      error: 'Invalid request data',
      details: result.error.issues.map((issue) => ({ field: issue.path.join('.') || location, message: issue.message })),
    });
  }
  req[location] = result.data;
  return next();
};

export const validateSocketPayload = (schema, payload) => schema.safeParse(payload);
