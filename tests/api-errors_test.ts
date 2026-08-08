import { assertEquals } from '$std/assert/assert_equals.ts';
import { App, type Context, HttpError } from 'fresh';
import { ArcRateLimiter } from '../lib/rate-limiting/src/arc-rate-limiter.ts';
import { State } from '../lib/types/common.ts';
import { apiErrorHandler } from '../lib/http.ts';
import RemoteStorage from '../lib/services/storage/remote-storage.ts';

const rateLimitOptions = {
    maxRequests: 1,
    windowMs: 60_000,
    blockDurationMs: 2000,
    identifier: 'test-api-errors',
    serverSecret: 'super-secret',
    enablePeriodicCleanup: false,
};

Deno.test('API errors - rate-limited responses are JSON', async () => {
    const rateLimiter = new ArcRateLimiter(rateLimitOptions);
    const handler = new App<State>()
        .use(async (ctx: Context<State>) => {
            try {
                return await rateLimiter.middleware<State>()(ctx);
            } catch (error) {
                if (new URL(ctx.req.url).pathname.startsWith('/api/')) {
                    ctx.error = error;
                    return apiErrorHandler(ctx);
                }
                throw error;
            }
        })
        .onError('/api', apiErrorHandler)
        .post('/api/notes', () =>
            new Response('{}', {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }))
        .handler();

    const first = await handler(
        new Request('http://localhost/api/notes', { method: 'POST' }),
    );
    assertEquals(first.status, 200);

    // Second request hits the limit: must be JSON, not the HTML error page
    const blocked = await handler(
        new Request('http://localhost/api/notes', { method: 'POST' }),
    );
    assertEquals(blocked.status, 429);
    assertEquals(blocked.headers.get('Content-Type'), 'application/json');

    const body = await blocked.json();
    assertEquals(typeof body.message, 'string');
    assertEquals(body.message.length > 0, true);
    rateLimiter.destroy();
});

Deno.test('API errors - apiErrorHandler renders HttpError as JSON with rate-limit details', async () => {
    const rateLimitResult = {
        allowed: false,
        remaining: 0,
        resetTime: 1_700_000_000_000,
        retryAfter: 120,
    };

    const handler = new App<State>()
        .onError('/api', apiErrorHandler)
        .post('/api/notes', () => {
            throw new HttpError(429, 'Too Many Requests', {
                cause: rateLimitResult,
            });
        })
        .handler();

    const response = await handler(
        new Request('http://localhost/api/notes', { method: 'POST' }),
    );

    assertEquals(response.status, 429);
    assertEquals(response.headers.get('Content-Type'), 'application/json');

    const body = await response.json();
    assertEquals(body.message, 'You have made too many requests. Please wait a moment before trying again.');
    assertEquals(body.code, 'RATE_LIMITED');
    assertEquals(body.retryAfter, 120);
    assertEquals(body.resetTime, 1_700_000_000_000);
});

Deno.test('API errors - apiErrorHandler renders unknown errors as JSON 500', async () => {
    const handler = new App<State>()
        .onError('/api', apiErrorHandler)
        .post('/api/notes', () => {
            throw new Error('boom');
        })
        .handler();

    const response = await handler(
        new Request('http://localhost/api/notes', { method: 'POST' }),
    );

    assertEquals(response.status, 500);
    assertEquals(response.headers.get('Content-Type'), 'application/json');

    const body = await response.json();
    assertEquals(body.message, 'Internal server error');
});

Deno.test('RemoteStorage - never surfaces raw HTML bodies as error messages', async () => {
    const originalFetch = globalThis.fetch;

    try {
        // Simulates a proxy/CDN HTML error page (the pre-fix bug source)
        globalThis.fetch = (() =>
            Promise.resolve(
                new Response('<html><body>Rate limit exceeded</body></html>', {
                    status: 429,
                }),
            )) as typeof fetch;

        const storage = new RemoteStorage();
        const result = await storage.get('nonexistent-id');

        assertEquals(result.success, false);
        assertEquals(typeof result.message, 'string');
        assertEquals(result.message!.includes('<html'), false);
        assertEquals(result.message!.length > 0, true);
    } finally {
        globalThis.fetch = originalFetch;
    }
});

Deno.test('RemoteStorage - parses JSON error messages from API responses', async () => {
    const originalFetch = globalThis.fetch;

    try {
        globalThis.fetch = (() =>
            Promise.resolve(
                new Response(JSON.stringify({ message: 'Note not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' },
                }),
            )) as typeof fetch;

        const storage = new RemoteStorage();
        const result = await storage.get('nonexistent-id');

        assertEquals(result.success, false);
        assertEquals(result.message, 'Note not found');
    } finally {
        globalThis.fetch = originalFetch;
    }
});

Deno.test('RemoteStorage - 429 with retryAfter falls back to a countdown message', async () => {
    const originalFetch = globalThis.fetch;

    try {
        // JSON body without a usable message but with retryAfter
        globalThis.fetch = (() =>
            Promise.resolve(
                new Response(JSON.stringify({ retryAfter: 30 }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' },
                }),
            )) as typeof fetch;

        const storage = new RemoteStorage();
        const result = await storage.get('note-id');

        assertEquals(result.success, false);
        assertEquals(result.message, 'You have made too many requests. Please try again in 30 seconds.');
    } finally {
        globalThis.fetch = originalFetch;
    }
});
