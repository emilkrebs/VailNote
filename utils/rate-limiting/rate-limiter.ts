import { ArcRateLimiter } from './arc-rate-limiter.ts';

let defaultArcRateLimiter: ArcRateLimiter | undefined = undefined;

export function initializeArcRateLimiter() {
	defaultArcRateLimiter = new ArcRateLimiter(
		10, // 10 requests per minute
		60 * 1000, // 1 minute window
		5 * 60 * 1000, // 5 minute block
	);
}

export function getDefaultArcRateLimiter(): ArcRateLimiter {
	if (!defaultArcRateLimiter) {
		throw new Error('ARC Rate Limiter not initialized. Call init() first.');
	}
	return defaultArcRateLimiter;
}
