import { defaultLogger } from '../logging.ts';
import { ArcRateLimiter } from './arc-rate-limiter.ts';

let defaultArcRateLimiter: ArcRateLimiter | undefined = undefined;

export function initializeArcRateLimiter() {
	defaultArcRateLimiter = new ArcRateLimiter(
		10, // 10 requests per minute
		60 * 1000, // 1 minute window
		5 * 60 * 1000, // 5 minute block
	);
	defaultLogger.log('ARC Rate Limiter initialized with 10 requests per minute limit.');
}

export function getDefaultArcRateLimiter(): ArcRateLimiter {
	if (!defaultArcRateLimiter) {
		throw new Error('ARC Rate Limiter not initialized. Call initializeArcRateLimiter() first.');
	}
	return defaultArcRateLimiter;
}
