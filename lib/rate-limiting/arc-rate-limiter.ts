import { HttpError, Middleware } from 'fresh';
import { generateSHA256Hash } from '../hashing.ts';
import { generateRateLimitHeaders, RateLimitResult } from './rate-limit-headers.ts';

interface ArcEntry {
    count: number;
    resetTime: number;
    blocked: boolean;
    blockUntil?: number;
}

/**
 * Anonymous Rate-Limited Credentials (ARC) system
 * Uses anonymous tokens derived from IP addresses with daily rotation
 * to provide rate limiting while preserving user privacy.
 */
export class ArcRateLimiter {
    private store = new Map<string, ArcEntry>();
    private readonly maxRequests: number;
    private readonly windowMs: number;
    private readonly blockDurationMs: number;
    private cleanupTimer?: number;

    constructor(
        maxRequests = 10,
        windowMs = 60 * 1000, // 1 minute
        blockDurationMs = 5 * 60 * 1000, // 5 minutes
        enablePeriodicCleanup = true, // Allow disabling periodic cleanup for tests
    ) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.blockDurationMs = blockDurationMs;

        if (enablePeriodicCleanup) {
            this.startPeriodicCleanup();
        }
    }

    /**
     * Check if a request should be allowed and return rate limit status
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

        let entry = this.store.get(arcToken);

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
            this.store.set(arcToken, entry);

            return {
                allowed: false,
                remaining: 0,
                resetTime: entry.resetTime,
                retryAfter: Math.ceil((entry.blockUntil - now) / 1000),
                arcToken,
            };
        }

        // Store the updated entry
        this.store.set(arcToken, entry);

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
     */
    private async generateArcToken(request: Request): Promise<string> {
        const clientIdentifier = this.extractClientIdentifier(request);
        const dailySalt = this.getDailySalt();

        // Create ARC token: hash(client_identifier + daily_salt + service_identifier)
        const arcInput = `${clientIdentifier}:${dailySalt}:vailnote-arc`;
        return await generateSHA256Hash(arcInput);
    }

    /**
     * Extract client identifier from request headers in a privacy-preserving way
     */
    private extractClientIdentifier(request: Request): string {
        const headers = request.headers;

        // Try to get real IP from common proxy headers (!)
        const xForwardedFor = headers.get('x-forwarded-for');
        if (xForwardedFor) {
            const clientIp = xForwardedFor.split(',')[0].trim();
            if (this.isValidIp(clientIp)) {
                return clientIp;
            }
        }

        const xRealIp = headers.get('x-real-ip');
        if (xRealIp && this.isValidIp(xRealIp)) {
            return xRealIp;
        }

        const cfConnectingIp = headers.get('cf-connecting-ip');
        if (cfConnectingIp && this.isValidIp(cfConnectingIp)) {
            return cfConnectingIp;
        }

        // Fallback to user agent + accept headers for some uniqueness
        const userAgent = headers.get('user-agent') || 'unknown';
        const accept = headers.get('accept') || 'unknown';
        return `fallback:${userAgent.substring(0, 50)}:${accept.substring(0, 50)}`;
    }

    /**
     * Generate daily rotating salt for ARC tokens
     */
    private getDailySalt(): string {
        const today = new Date();
        return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    }

    /**
     * Basic IP validation
     */
    private isValidIp(ip: string): boolean {
        if (!ip || typeof ip !== 'string') return false;

        ip = ip.trim();

        // IPv4 validation
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (ipv4Regex.test(ip)) return true;

        // IPv6 validation (simplified)
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
        return ipv6Regex.test(ip);
    }

    /**
     * Start periodic cleanup of expired entries
     */
    private startPeriodicCleanup(): void {
        this.cleanupTimer = setInterval(() => {
            this.cleanup();
        }, 30 * 60 * 1000); // Every 30 minutes
    }

    /**
     * Clean up expired entries
     */
    private cleanup(): void {
        const now = Date.now();
        for (const [token, entry] of this.store.entries()) {
            // Remove entries that are past reset time and not blocked
            if (now >= entry.resetTime && (!entry.blocked || (entry.blockUntil && now >= entry.blockUntil))) {
                this.store.delete(token);
            }
        }
    }

    /**
     * Get store statistics for monitoring
     */
    getStats(): { activeTokens: number; blockedTokens: number } {
        let blockedCount = 0;
        for (const entry of this.store.values()) {
            if (entry.blocked) blockedCount++;
        }
        return {
            activeTokens: this.store.size,
            blockedTokens: blockedCount,
        };
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        this.store.clear();
    }
}

export function rateLimiter<State>(rateLimiter: ArcRateLimiter): Middleware<State> {
    return async (ctx) => {
        const rateLimitResult = await rateLimiter.checkRateLimit(ctx.req);
        const res = await ctx.next();
        if (!rateLimitResult.allowed) {
            throw new HttpError(429, 'Too Many Requests', {
                cause: {
                    allowed: rateLimitResult.allowed,
                    remaining: rateLimitResult.remaining,
                    retryAfter: rateLimitResult.retryAfter,
                    resetTime: rateLimitResult.resetTime,
                } as RateLimitResult,
            });
        }
        const rateLimitHeaders = generateRateLimitHeaders(rateLimitResult, rateLimiter.maxRequests);
        for (const [key, value] of Object.entries(rateLimitHeaders)) {
            res.headers.set(key, value);
        }
        return res;
    };
}
