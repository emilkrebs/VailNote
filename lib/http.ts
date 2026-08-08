import { Context, HttpError } from 'fresh';
import { State } from './types/common.ts';
import { RateLimitResult } from '../lib/rate-limiting/src/rate-limit-headers.ts';
import { defaultLogger } from '../lib/logging.ts';

export interface ApiErrorBody {
    message: string;
    code?: string;
    retryAfter?: number;
    resetTime?: number;
}

export function jsonResponse(body: unknown, status: number, headers?: HeadersInit): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
    });
}

export function jsonError(status: number, message: string, code?: string): Response {
    return jsonResponse({ message, code } as ApiErrorBody, status);
}

const ERROR_CODES: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    405: 'METHOD_NOT_ALLOWED',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
};

const ERROR_MESSAGES: Record<number, string> = {
    429: 'You have made too many requests. Please wait a moment before trying again.',
};

/**
 * Error handler for API routes. Renders any error thrown below it —
 * including the ARC rate limiter's 429 `HttpError` — as a JSON response.
 * API clients parse `message`, `code`, and (for 429) `retryAfter`/`resetTime`
 * from the body, so API errors must never be rendered as the HTML error page
 * or plain text.
 */
export function apiErrorHandler(ctx: Context<State>): Response {
    const error = ctx.error;
    const status = error instanceof HttpError ? error.status : 500;
    const body: ApiErrorBody = {
        message: ERROR_MESSAGES[status] ??
            (error instanceof HttpError ? error.message : 'Internal server error'),
        code: ERROR_CODES[status] ?? 'INTERNAL_ERROR',
    };

    if (error instanceof HttpError && status === 429 && error.cause) {
        const rateLimit = error.cause as RateLimitResult;
        if (rateLimit.retryAfter !== undefined) {
            body.retryAfter = rateLimit.retryAfter;
        }
        if (rateLimit.resetTime !== undefined) {
            body.resetTime = rateLimit.resetTime;
        }
    }

    if (status >= 500) {
        defaultLogger.error(
            `API error: ${status} - ${error instanceof Error ? error.message : String(error)}`,
        );
    }

    return jsonResponse(body, status);
}
