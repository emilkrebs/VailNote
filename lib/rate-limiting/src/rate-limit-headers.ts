/**
 * Utility functions for generating standardized rate limit headers
 * Used across different endpoints to maintain consistency
 */

/**
 * Result object returned by rate limit checks
 * @interface RateLimitResult
 */
export interface RateLimitResult {
  /** Whether the request is allowed to proceed */
  allowed: boolean;
  /** Number of requests remaining in the current window */
  remaining: number;
  /** Timestamp when the current window resets */
  resetTime: number;
  /** Seconds to wait before retrying (only present when blocked) */
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
  // Input validation
  if (!rateLimitResult || typeof rateLimitResult !== "object") {
    throw new Error("rateLimitResult is required and must be an object");
  }
  if (maxRequests <= 0) {
    throw new Error("maxRequests must be positive");
  }

  const resetTime = new Date(rateLimitResult.resetTime);

  const headers: Record<string, string> = {
    "X-RateLimit-Limit": maxRequests.toString(),
    "X-RateLimit-Remaining": Math.max(0, rateLimitResult.remaining).toString(),
    "X-RateLimit-Reset": resetTime.toISOString(),
  };

  // Add Retry-After header for blocked requests
  if (!rateLimitResult.allowed && rateLimitResult.retryAfter) {
    headers["Retry-After"] = Math.max(0, rateLimitResult.retryAfter).toString();
  }

  return headers;
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
  // Input validation
  if (!existingHeaders || typeof existingHeaders !== "object") {
    throw new Error("existingHeaders is required and must be an object");
  }

  const rateLimitHeaders = generateRateLimitHeaders(
    rateLimitResult,
    maxRequests,
  );
  return { ...existingHeaders, ...rateLimitHeaders };
}
