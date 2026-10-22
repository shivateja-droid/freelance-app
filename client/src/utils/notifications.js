export const getSafeErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const responseData = error?.response?.data;
  const detailMessage = responseData?.details?.find((detail) => detail?.message)?.message;
  const responseMessage = responseData?.msg || detailMessage;

  if (responseMessage) return responseMessage;
  if (responseData?.error && responseData.error !== 'Internal server error') return responseData.error;
  if (!error?.response) return 'Unable to connect to the server. Please try again.';
  return fallback;
};