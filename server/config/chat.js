export const CHAT_MESSAGE_RATE_LIMIT = 20;
export const CHAT_MESSAGE_RATE_WINDOW_MS = 10_000;
export const CHAT_HISTORY_LIMIT = 100;
export const CHAT_RATE_LIMIT_MAX_USERS = 10_000;

export const createMessageRateLimiter = ({
	limit = CHAT_MESSAGE_RATE_LIMIT,
	windowMs = CHAT_MESSAGE_RATE_WINDOW_MS,
	maxUsers = CHAT_RATE_LIMIT_MAX_USERS,
	now = Date.now,
	startCleanup = true,
} = {}) => {
	const attemptsByUser = new Map();
	let cleanupTimer;

	const cleanupExpired = () => {
		const cutoff = now() - windowMs;
		for (const [userId, attempts] of attemptsByUser) {
			const recentAttempts = attempts.filter((timestamp) => timestamp > cutoff);
			if (recentAttempts.length === 0) attemptsByUser.delete(userId);
			else attemptsByUser.set(userId, recentAttempts);
		}
	};

	const start = () => {
		if (!startCleanup || cleanupTimer) return;
		cleanupTimer = setInterval(cleanupExpired, windowMs);
		cleanupTimer.unref?.();
	};

	const stop = () => {
		if (cleanupTimer) clearInterval(cleanupTimer);
		cleanupTimer = undefined;
		attemptsByUser.clear();
	};

	const consume = (userId) => {
		start();
		const currentTime = now();
		const recentAttempts = (attemptsByUser.get(userId) || [])
			.filter((timestamp) => currentTime - timestamp < windowMs);
		if (recentAttempts.length >= limit) {
			attemptsByUser.set(userId, recentAttempts);
			return false;
		}

		if (!attemptsByUser.has(userId) && attemptsByUser.size >= maxUsers) {
			cleanupExpired();
			if (attemptsByUser.size >= maxUsers) return false;
		}
		recentAttempts.push(currentTime);
		attemptsByUser.set(userId, recentAttempts);
		return true;
	};

	return {
		consume,
		cleanupExpired,
		size: () => attemptsByUser.size,
		stop,
	};
};