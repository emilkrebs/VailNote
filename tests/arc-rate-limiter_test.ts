import { assertEquals } from '$std/assert/assert_equals.ts';
import { App } from 'fresh';
import { ArcRateLimiter, rateLimiter } from '../lib/rate-limiting/arc-rate-limiter.ts';
import { State } from '../main.ts';
import Home from '../routes/index.tsx';
import { TestDataFactory } from './main_test.ts';
import { assertExists } from '$std/assert/assert_exists.ts';
import { encryptNoteContent } from '../lib/encryption.ts';
import { generateDeterministicClientHash } from '../lib/hashing.ts';

Deno.test('ARC Rate Limiter - basic functionality', async () => {
    const app = new App<State>()
        .use(rateLimiter(new ArcRateLimiter(3, 1000, 2000, false))) // 3 requests per second, 2s block
        .get('/', (ctx) => ctx.render(Home()));

    const handler = app.handler();

    // First 3 requests should be allowed
    for (let i = 0; i < 3; i++) {
        const response = await handler(new Request(`http://localhost`));
        assertEquals(response.status, 200);
    }

    // 4th request should be blocked
    const blockedResult = await (async () => {
        const response = await handler(new Request(`http://localhost`));
        return response.status;
    })();

    assertEquals(blockedResult, 429);
});

Deno.test('ARC Rate Limiter - different clients handled separately', async () => {
    const rateLimiter = new ArcRateLimiter(2, 1000, 2000);

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
    const app = new App<State>()
        .use(rateLimiter(new ArcRateLimiter(2, 1000, 2000, false))) // 2 requests per second, 2s block
        .get('/', (ctx) => ctx.render(Home()));

    const handler = app.handler();

    const request = new Request('http://localhost', {
        method: 'GET',
        headers: { 'x-forwarded-for': '192.168.1.100' },
    });

    // Check that ARC tokens are generated consistently for same client
    const result1 = await handler(request);
    const result2 = await handler(request);

    // Same client should have consistent token (indirectly verified by rate limiting working)
    assertEquals(result1.status, 200);
    assertEquals(result2.status, 200);
    assertEquals(result1.headers.get('X-RateLimit-Remaining'), '1');
    assertEquals(result2.headers.get('X-RateLimit-Remaining'), '0');

    // Verify ARC tokens are not raw IP addresses
    const testRateLimiter = new ArcRateLimiter(2, 1000, 2000, false);
    const rateLimitCheck = await testRateLimiter.checkRateLimit(request);

    assertEquals(typeof rateLimitCheck.arcToken, 'string');
    assertEquals(rateLimitCheck.arcToken.includes('192.168.1.100'), false);

    testRateLimiter.destroy();
});

Deno.test({
    name: 'ARC Rate Limiter - Check API integration',
    fn: async (t) => {
        const { handler: notesHandler } = await import('../routes/api/notes.ts');

        const handler = new App<State>()
            .use(rateLimiter(new ArcRateLimiter(2, 1000, 2000)))
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
