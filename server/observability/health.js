import mongoose from 'mongoose';

const connectionStates = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export const databaseHealth = () => {
  const state = mongoose.connection.readyState;
  return {
    connected: state === 1,
    state: connectionStates[state] || 'unknown',
  };
};
