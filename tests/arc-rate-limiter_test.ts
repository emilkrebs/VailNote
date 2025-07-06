import { assertEquals } from '$std/assert/assert_equals.ts';
import { ArcRateLimiter } from '../utils/rate-limiting/arc-rate-limiter.ts';

Deno.test('ARC Rate Limiter - basic functionality', async () => {
	const rateLimiter = new ArcRateLimiter(3, 1000, 2000); // 3 requests per second

	// Create mock request
	const mockRequest = new Request('http://localhost:8000/api/notes', {
		method: 'POST',
		headers: {
			'x-forwarded-for': '192.168.1.100',
			'user-agent': 'test-agent',
		},
	});

	// First 3 requests should be allowed
	for (let i = 0; i < 3; i++) {
		const result = await rateLimiter.checkRateLimit(mockRequest);
		assertEquals(result.allowed, true);
		assertEquals(result.remaining, 3 - (i + 1));
	}

	// 4th request should be blocked
	const blockedResult = await rateLimiter.checkRateLimit(mockRequest);
	assertEquals(blockedResult.allowed, false);
	assertEquals(blockedResult.remaining, 0);
	assertEquals(typeof blockedResult.retryAfter, 'number');

	rateLimiter.destroy();
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
	const rateLimiter = new ArcRateLimiter(2, 1000, 2000);

	const request = new Request('http://localhost:8000/api/notes', {
		method: 'POST',
		headers: { 'x-forwarded-for': '192.168.1.100' },
	});

	// Check that ARC tokens are generated consistently for same client
	const result1 = await rateLimiter.checkRateLimit(request);
	const result2 = await rateLimiter.checkRateLimit(request);

	// Same client should have consistent token (indirectly verified by rate limiting working)
	assertEquals(result1.allowed, true);
	assertEquals(result2.allowed, true);
	assertEquals(result1.remaining, 1);
	assertEquals(result2.remaining, 0);

	// Verify ARC tokens are not raw IP addresses
	assertEquals(typeof result1.arcToken, 'string');
	assertEquals(result1.arcToken.includes('192.168.1.100'), false);

	rateLimiter.destroy();
});
