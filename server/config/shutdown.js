const defaultLogger = {
  info: () => {},
  error: () => {},
};

export const createShutdownHandler = ({
  stopAccepting = async () => {},
  closeSocket = async () => {},
  disconnectDatabase = async () => {},
  logger = defaultLogger,
  timeoutMs = 10_000,
} = {}) => {
  let shutdownPromise;

  return async (signal = 'shutdown') => {
    if (shutdownPromise) return shutdownPromise;

    shutdownPromise = (async () => {
      logger.info({ event: 'server_shutdown_started', signal }, 'KaamSetu server shutting down');
      const cleanupSteps = [stopAccepting, closeSocket, disconnectDatabase];
      const cleanup = (async () => {
        const errors = [];
        for (const step of cleanupSteps) {
          try {
            await step();
          } catch (error) {
            errors.push(error);
          }
        }
        if (errors.length > 0) throw new AggregateError(errors, 'One or more shutdown steps failed');
      })();

      let timedOut = false;
      cleanup.then(
        () => {
          if (timedOut) logger.error({ event: 'server_shutdown_late_completion', signal }, 'Shutdown cleanup completed after the deadline');
        },
        (error) => {
          if (timedOut) logger.error({ err: error, event: 'server_shutdown_late_failure', signal }, 'Shutdown cleanup failed after the deadline');
        },
      );

      let timeoutId;
      const timeout = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve({ status: 'timed_out' }), timeoutMs);
      });
      const result = await Promise.race([
        cleanup.then(() => ({ status: 'completed' }), (error) => ({ status: 'failed', error })),
        timeout,
      ]);
      clearTimeout(timeoutId);

      if (result.status === 'completed') {
        logger.info({ event: 'server_shutdown_completed', signal }, 'KaamSetu server shut down');
        return result;
      }
      if (result.status === 'timed_out') {
        timedOut = true;
        logger.error({ event: 'server_shutdown_timeout', signal, timeoutMs }, 'Shutdown deadline exceeded; cleanup is incomplete');
        return result;
      }

      logger.error({ err: result.error, event: 'server_shutdown_failed', signal }, 'Server shutdown failed');
      return result;
    })();

    return shutdownPromise;
  };
};