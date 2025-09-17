import { assertEquals } from '$std/assert/assert_equals.ts';
import { App } from 'fresh';
import { ArcRateLimiter } from '../lib/rate-limiting/src/arc-rate-limiter.ts';
import { State } from '../lib/types/common.ts';
import Home from '../routes/index.tsx';
import { TestDataFactory } from './main_test.ts';
import { assertExists } from '$std/assert/assert_exists.ts';
import { encryptNoteContent } from '../lib/encryption.ts';
import { generateDeterministicClientHash } from '../lib/hashing.ts';
import { DenoKVArcStore } from '../lib/rate-limiting/src/arc-store.ts';

const defaultRateLimitOptions = {
    maxRequests: 2,
    windowMs: 1000,
    blockDurationMs: 2000,
    identifier: 'test-arc-rate-limiter',
    serverSecret: 'super-secret',
    enablePeriodicCleanup: false,
};

Deno.test('ARC Rate Limiter - basic functionality', async () => {
    const rateLimiter = new ArcRateLimiter(defaultRateLimitOptions);
    const app = new App<State>()
        .use(rateLimiter.middleware()) // 3 requests per second, 2s block
        .get('/', (ctx) => ctx.render(Home()));

    const handler = app.handler();

    // First 2 requests should be allowed
    for (let i = 0; i < 2; i++) {
        const response = await handler(new Request(`http://localhost`));
        assertEquals(response.status, 200);
    }

    // 3rd request should be blocked
    const blockedResult = await (async () => {
        const response = await handler(new Request(`http://localhost`));
        return response.status;
    })();

    assertEquals(blockedResult, 429);
    rateLimiter.destroy();
});

Deno.test('ARC Rate Limiter - Deno KV store integration', async () => {
    const dataDir = './deno-kv-test.db';
    const arcStore = await (new DenoKVArcStore()).init(dataDir);
    const rateLimiter = new ArcRateLimiter({ ...defaultRateLimitOptions, store: arcStore });

    const request = new Request('http://localhost:8000/api/notes', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.100' },
    });

    const response = await rateLimiter.checkRateLimit(request);
    assertEquals(response.allowed, true);
    assertEquals(response.remaining, 1);

    await arcStore.clear();
    await arcStore.close();
    rateLimiter.destroy();

    try {
        Deno.removeSync(dataDir);
    } catch {
        // ignore errors during cleanup
    }
});

Deno.test('ARC Rate Limiter - different clients handled separately', async () => {
    const rateLimiter = new ArcRateLimiter(defaultRateLimitOptions);

    const request1 = new Request('http://localhost:8000/api/notes', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.100' },
    });

    const request2 = new Request('http://localhost:8000/api/notes', {
        method: 'POST',
        headers: { 'x-forwarded-for': '192.168.1.101' },
    });

    // Use up quota for client 1
    await rateLimiter.checkRateLimit(request1);
    await rateLimiter.checkRateLimit(request1);

    // Client 1 should be at limit
    const client1Result = await rateLimiter.checkRateLimit(request1);
    assertEquals(client1Result.allowed, false);

    // Client 2 should still be allowed
    const client2Result = await rateLimiter.checkRateLimit(request2);
    assertEquals(client2Result.allowed, true);
    assertEquals(client2Result.remaining, 1);

    rateLimiter.destroy();
});

Deno.test('ARC Rate Limiter - privacy protection', async () => {
    const rateLimiter = new ArcRateLimiter(defaultRateLimitOptions);
    const app = new App<State>()
        .use(rateLimiter.middleware()) // 2 requests per second, 2s block
        .get('/', (ctx) => ctx.render(Home()));

    const handler = app.handler();

    const request = new Request('http://localhost', {
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.100' },
    });

    // Check that ARC tokens are generated consistently for same client
    const result1 = await handler(request);
    const result2 = await handler(request);

    // Same client should have consistent token (indirectly verified by rate-limiting working)
    assertEquals(result1.status, 200);
    assertEquals(result2.status, 200);
    assertEquals(result1.headers.get('X-RateLimit-Remaining'), '1');
    assertEquals(result2.headers.get('X-RateLimit-Remaining'), '0');

    // Verify ARC tokens are not raw IP addresses
    const rateLimitCheck = await rateLimiter.checkRateLimit(request);

    assertEquals(typeof rateLimitCheck.arcToken, 'string');
    assertEquals(rateLimitCheck.arcToken.includes('192.168.1.100'), false);

    rateLimiter.destroy();
});

Deno.test({
    name: 'ARC Rate Limiter - Check API integration',
    fn: async (t) => {
        const { handler: notesHandler } = await import('../routes/api/notes.ts');
        const rateLimiter = new ArcRateLimiter(defaultRateLimitOptions);
        const handler = new App<State>()
            .use(rateLimiter.middleware())
            .post('/api/notes', async (ctx) => await notesHandler.POST(ctx))
            .handler();

        const testData = TestDataFactory.createNoteData();

        await t.step('should block third request', async () => {
            // First two requests should succeed
            for (let i = 0; i < 2; i++) {
                const encryptedContent = await encryptNoteContent(testData.content, testData.password);

                const request = new Request(`http://localhost/api/notes`, {
                    method: 'POST',
                    body: JSON.stringify({
                        content: encryptedContent.encrypted,
                        iv: encryptedContent.iv,
                        password: await generateDeterministicClientHash(testData.password),
                        expiresIn: testData.expiresIn,
                    }),
                    headers: { 'Content-Type': 'application/json' },
                });

                const response = await handler(request);

                const data = await response.json();
                assertEquals(response.status, 201);
                assertEquals(data.message, 'Note saved successfully!');
                assertExists(data.noteId, 'Note ID should be present in API response');
            }
            const encryptedContent = await encryptNoteContent(testData.content, testData.password);

            const request = new Request(`http://localhost/api/notes`, {
                method: 'POST',
                body: JSON.stringify({
                    content: encryptedContent.encrypted,
                    iv: encryptedContent.iv,
                    password: await generateDeterministicClientHash(testData.password),
                    expiresIn: testData.expiresIn,
                }),
                headers: { 'Content-Type': 'application/json' },
            });

            const thirdResponse = await handler(request);
            assertEquals(thirdResponse.status, 429);
        });
    },
    sanitizeResources: false,
    sanitizeOps: false,
});
