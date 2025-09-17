// deno-lint-ignore-file no-explicit-any
import { type Context, HttpError, type Middleware } from "fresh";

import {
  generateRateLimitHeaders,
  type RateLimitResult,
} from "./rate-limit-headers.ts";
import { generateHMACSHA256 } from "../../hashing.ts";
import { type ArcStore, InMemoryArcStore } from "./arc-store.ts";

// Constants for better maintainability
const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
const DEFAULT_ARC_IDENTIFIER = "default-arc";
const FALLBACK_PREFIX = "fallback:";
const USER_AGENT_MAX_LENGTH = 50;
const ACCEPT_HEADER_MAX_LENGTH = 50;

/**
 * Represents an entry in the ARC rate limiter store
 * @interface ArcEntry
 */
export interface ArcEntry {
  /** Current count of requests in the time window */
  count: number;
  /** Timestamp when the current window resets */
  resetTime: number;
  /** Whether this client is currently blocked */
  blocked: boolean;
  /** Timestamp when the block expires (if blocked) */
  blockUntil?: number;
}

export interface ArcRateLimiterOptions {
  maxRequests?: number;
  windowMs?: number;
  blockDurationMs?: number;
  identifier?: string;
  serverSecret: string;
  enablePeriodicCleanup?: boolean;
  store?: ArcStore;
}

/**
 * Anonymous Rate-Limited Credentials (ARC) system
 * Uses anonymous tokens derived from IP addresses with daily rotation
 * to provide rate limiting while preserving user privacy.
 * @constructor ArcRateLimiter
 * @param maxRequests Maximum requests allowed per window
 * @param windowMs Time window in milliseconds
 * @param blockDurationMs Duration to block after exceeding limit in milliseconds
 * @param identifier Service identifier for ARC token generation
 * @param serverSecret Secret key for HMAC generation
 * @param store Custom store implementation for flexibility (defaults to in-memory)
 * @param enablePeriodicCleanup Whether to enable periodic cleanup of expired entries
 * @example
 * // Custom service identifier for ARC tokens
 * const rateLimiter = new ArcRateLimiter(10, 60000, 300000, 'my-service', 'super-secret', true);
 * app.use(rateLimiter.middleware());
 */
export class ArcRateLimiter {
  private store: ArcStore;
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly blockDurationMs: number;
  private readonly identifier: string;
  private readonly serverSecret: string;
  private cleanupTimer?: number;

  constructor({
    maxRequests = DEFAULT_MAX_REQUESTS,
    windowMs = DEFAULT_WINDOW_MS,
    blockDurationMs = DEFAULT_BLOCK_DURATION_MS,
    identifier = DEFAULT_ARC_IDENTIFIER,
    serverSecret,
    enablePeriodicCleanup = true,
    store = new InMemoryArcStore(),
  }: ArcRateLimiterOptions) {
    if (maxRequests <= 0) throw new Error("maxRequests must be positive");
    if (windowMs <= 0) throw new Error("windowMs must be positive");
    if (blockDurationMs < 0) {
      throw new Error("blockDurationMs cannot be negative");
    }
    if (!identifier.trim()) throw new Error("identifier cannot be empty");
    if (!serverSecret.trim()) throw new Error("serverSecret cannot be empty");

    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.blockDurationMs = blockDurationMs;
    this.identifier = identifier.trim();
    this.serverSecret = serverSecret;
    this.store = store;

    if (enablePeriodicCleanup) {
      this.startPeriodicCleanup();
    }
  }
  /**
   * Check if a request should be allowed and return rate limit status
   * @param request - The incoming HTTP request to check
   * @returns Promise containing rate limit result with ARC token
   * @example
   * ```ts
   * const result = await rateLimiter.checkRateLimit(request);
   * if (!result.allowed) {
   *   console.log(`Blocked! Retry after ${result.retryAfter} seconds`);
   * }
   * ```
   */
  async checkRateLimit(request: Request): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
    arcToken: string;
  }> {
    const arcToken = await this.generateArcToken(request);
    const now = Date.now();

    let entry = await this.store.get(arcToken);

    // Check if currently blocked
    if (entry?.blocked && entry.blockUntil && now < entry.blockUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
        arcToken,
      };
    }

    // Reset or create entry if window has expired
    if (!entry || now >= entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + this.windowMs,
        blocked: false,
      };
    }

    // Clear block if expired
    if (entry.blocked && entry.blockUntil && now >= entry.blockUntil) {
      entry.blocked = false;
      entry.blockUntil = undefined;
    }

    // Increment count first
    entry.count++;

    // Check if we've exceeded the limit
    if (entry.count > this.maxRequests) {
      entry.blocked = true;
      entry.blockUntil = now + this.blockDurationMs;
      await this.store.set(arcToken, entry);

      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
        arcToken,
      };
    }

    // Store the updated entry
    await this.store.set(arcToken, entry);

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
      arcToken,
    };
  }

  /**
   * Generate an Anonymous Rate-Limited Credential (ARC) token
   * This creates a privacy-preserving identifier that rotates daily
   * @param request - The HTTP request to generate token for
   * @returns Promise containing the base64-encoded ARC token
   * @private
   */
  private async generateArcToken(request: Request): Promise<string> {
    const clientIdentifier = this.extractClientIdentifier(request);
    const dailySalt = this.getDailySalt();

    // Create ARC token: hash(client_identifier + daily_salt + service_identifier)
    const arcInput = `${clientIdentifier}:${dailySalt}:${this.identifier}`;
    return await generateHMACSHA256(arcInput, this.serverSecret);
  }

  /**
   * Extract client identifier from request headers in a privacy-preserving way
   * Tries multiple proxy headers before falling back to user agent + accept headers
   * @param request - The HTTP request to extract identifier from
   * @returns Client identifier string (IP address or fallback hash input)
   * @private
   */
  private extractClientIdentifier(request: Request): string {
    const headers = request.headers;

    // Try to get real IP from common proxy headers (!)
    const xForwardedFor = headers.get("x-forwarded-for");
    if (xForwardedFor) {
      const clientIp = xForwardedFor.split(",")[0].trim();
      if (this.isValidIp(clientIp)) {
        return clientIp;
      }
    }

    const xRealIp = headers.get("x-real-ip");
    if (xRealIp && this.isValidIp(xRealIp)) {
      return xRealIp;
    }

    const cfConnectingIp = headers.get("cf-connecting-ip");
    if (cfConnectingIp && this.isValidIp(cfConnectingIp)) {
      return cfConnectingIp;
    }

    // Fallback to user agent + accept headers for some uniqueness
    const userAgent = headers.get("user-agent") || "unknown";
    const accept = headers.get("accept") || "unknown";
    return `${FALLBACK_PREFIX}${
      userAgent.substring(0, USER_AGENT_MAX_LENGTH)
    }:${accept.substring(0, ACCEPT_HEADER_MAX_LENGTH)}`;
  }

  /**
   * Generate daily rotating salt for ARC tokens
   * Format: YYYY-M-D (e.g., "2025-9-15")
   * @returns Daily salt string based on current date
   * @private
   */
  private getDailySalt(): string {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  }

  /**
   * Basic IP validation for both IPv4 and IPv6 addresses
   * @param ip - IP address string to validate
   * @returns true if valid IP address, false otherwise
   * @private
   */
  private isValidIp(ip: string): boolean {
    if (!ip || typeof ip !== "string") return false;

    const trimmedIp = ip.trim();
    if (trimmedIp.length === 0) return false;

    // IPv4 validation - improved regex
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (ipv4Regex.test(trimmedIp)) return true;

    // IPv6 validation - improved regex to handle more formats
    const ipv6Regex =
      /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;

    return ipv6Regex.test(trimmedIp);
  }

  /**
   * Start periodic cleanup of expired entries
   * Runs every 30 minutes to remove stale entries and free memory
   * @private
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, DEFAULT_CLEANUP_INTERVAL_MS); // Every 30 minutes
  }

  /**
   * Clean up expired entries from the store
   * Removes entries that are past reset time and not currently blocked
   * @private
   */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    if (!this.store.entries) {
      return;
    }
    const tokensToDelete: string[] = [];
    for await (const [token, entry] of this.store.entries()) {
      // Remove entries that are past reset time and not blocked
      if (
        now >= entry.resetTime &&
        (!entry.blocked || (entry.blockUntil && now >= entry.blockUntil))
      ) {
        tokensToDelete.push(token);
      }
    }
    if (tokensToDelete.length > 0) {
      if (typeof (this.store as any).deleteMany === "function") {
        await (this.store as any).deleteMany(tokensToDelete);
      } else {
        for (const token of tokensToDelete) {
          await this.store.delete(token);
        }
      }
    }
  }

  /**
   * Get store statistics for monitoring and debugging
   * @returns Object containing active and blocked token counts
   * @example
   * ```ts
   * const stats = rateLimiter.getStats();
   * console.log(`Active: ${stats.activeTokens}, Blocked: ${stats.blockedTokens}`);
   * ```
   */
  async getStats(): Promise<{ activeTokens: number; blockedTokens: number }> {
    let blockedCount = 0;
    let totalCount = 0;

    if (!this.store.entries) {
      return { activeTokens: 0, blockedTokens: 0 };
    }

    const now = Date.now();
    const iterator = this.store.entries();

    for await (const [, entry] of iterator) {
      // Only count entries that are still active (not expired)
      if (
        now < entry.resetTime ||
        (entry.blocked && entry.blockUntil && now < entry.blockUntil)
      ) {
        totalCount++;
        if (entry.blocked) {
          blockedCount++;
        }
      }
    }

    return { activeTokens: totalCount, blockedTokens: blockedCount };
  }

  /**
   * Create Fresh middleware function for rate limiting
   * @returns Fresh middleware that applies rate limiting to requests
   * @template State - Fresh context state type
   * @example
   * ```ts
   * const app = new App()
   *   .use(rateLimiter.middleware())
   *   .get("/", () => new Response("Hello!"));
   * ```
   */
  middleware<State>(): Middleware<State> {
    return async (ctx: Context<State>) => {
      const rateLimitResult = await this.checkRateLimit(ctx.req);
      if (!rateLimitResult.allowed) {
        throw new HttpError(429, "Too Many Requests", {
          cause: {
            allowed: rateLimitResult.allowed,
            remaining: rateLimitResult.remaining,
            retryAfter: rateLimitResult.retryAfter,
            resetTime: rateLimitResult.resetTime,
          } as RateLimitResult,
        });
      }
      const res = await ctx.next();
      const rateLimitHeaders = generateRateLimitHeaders(
        rateLimitResult,
        this.maxRequests,
      );
      for (const [key, value] of Object.entries(rateLimitHeaders)) {
        res.headers.set(key, value);
      }
      return res;
    };
  }

  /**
   * Cleanup resources and stop periodic cleanup timer
   * Should be called when the rate limiter is no longer needed
   * @example
   * ```ts
   * // Cleanup before application shutdown
   * rateLimiter.destroy();
   * ```
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
  }
}
