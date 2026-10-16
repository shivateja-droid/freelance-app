import mongoose from 'mongoose';
import { logger } from './logger.js';

export const withLoggedTransaction = async (operation, work) => {
  const session = await mongoose.startSession();
  try {
    return await session.withTransaction(() => work(session));
  } catch (error) {
    if (!error.status || error.status >= 500) {
      logger.error({ err: error, operation }, 'Database transaction failed');
    }
    throw error;
  } finally {
    await session.endSession();
  }
};
