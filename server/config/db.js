import mongoose from 'mongoose';
import { logger } from '../observability/logger.js';

let listenersAttached = false;

const attachConnectionListeners = () => {
  if (listenersAttached) return;
  listenersAttached = true;
  mongoose.connection.on('connected', () => logger.info({ event: 'database_connected' }, 'MongoDB connected'));
  mongoose.connection.on('disconnected', () => logger.warn({ event: 'database_disconnected' }, 'MongoDB disconnected'));
  mongoose.connection.on('error', (error) => logger.error({ err: error, event: 'database_error' }, 'MongoDB connection error'));
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error({ event: 'database_configuration_error' }, 'MongoDB connection is not configured');
    throw new Error('MONGO_URI is not defined');
  }

  attachConnectionListeners();
  try {
    await mongoose.connect(mongoUri);
  } catch (error) {
    logger.error({ err: error, event: 'database_connection_failed' }, 'MongoDB connection failed');
    throw error;
  }
};

export default connectDB;
