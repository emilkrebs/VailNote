/**
 * Utility functions for generating standardized rate limit headers
 * Used across different endpoints to maintain consistency
 */

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
}

/**
 * Generate standard rate limit headers for HTTP responses
 * @param rateLimitResult - Result from ARC rate limiter
 * @param maxRequests - Maximum requests allowed (default: 10)
 * @returns Headers object with rate limit information
 */
export function generateRateLimitHeaders(
    rateLimitResult: RateLimitResult,
    maxRequests = 10,
): Record<string, string> {
    const resetTime = new Date(rateLimitResult.resetTime);

    const headers: Record<string, string> = {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': resetTime.toISOString(),
    };

    // Add Retry-After header for blocked requests
    if (!rateLimitResult.allowed && rateLimitResult.retryAfter) {
        headers['Retry-After'] = rateLimitResult.retryAfter.toString();
    }

    return headers;
}

/**
 * Generate headers specifically for 429 (Too Many Requests) responses
 * @param rateLimitResult - Result from ARC rate limiter
 * @param maxRequests - Maximum requests allowed (default: 10)
 * @returns Headers object for 429 responses
 */
export function generateRateLimitBlockedHeaders(
    rateLimitResult: RateLimitResult,
    maxRequests = 10,
): Record<string, string> {
    const resetTime = new Date(rateLimitResult.resetTime);

    return {
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': resetTime.toISOString(),
        'Retry-After': rateLimitResult.retryAfter?.toString() ||
            Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
    };
}

/**
 * Merge rate limit headers with existing headers
 * @param existingHeaders - Existing headers object
 * @param rateLimitResult - Result from ARC rate limiter
 * @param maxRequests - Maximum requests allowed (default: 10)
 * @returns Merged headers object
 */
export function mergeWithRateLimitHeaders(
    existingHeaders: Record<string, string>,
    rateLimitResult: RateLimitResult,
    maxRequests = 10,
): Record<string, string> {
    const rateLimitHeaders = generateRateLimitHeaders(rateLimitResult, maxRequests);
    return { ...existingHeaders, ...rateLimitHeaders };
}
