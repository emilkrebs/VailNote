import { Note } from '../../../types/types.ts';
import { mergeWithRateLimitHeaders } from '../../../lib/rate-limiting/rate-limit-headers.ts';
import { Context } from 'fresh';
import { getNoteDatabase, getRateLimiter } from '../../../lib/services/database-service.ts';
import * as bcrypt from 'bcrypt';

export const handler = async (ctx: Context<unknown>): Promise<Response> => {
	if (ctx.req.method !== 'POST' && ctx.req.method !== 'DELETE') {
		return new Response('Method not allowed', { status: 405 });
	}

	const rateLimitResult = await getRateLimiter().checkRateLimit(ctx.req);
	const db = await getNoteDatabase();

	// check if rate limit is exceeded
	if (!rateLimitResult.allowed) {
		const resetTime = new Date(rateLimitResult.resetTime);
		return new Response(
			JSON.stringify({
				message: 'Rate limit exceeded. Please try again later.',
				resetTime: resetTime.toISOString(),
				retryAfter: rateLimitResult.retryAfter,
			}),
			{
				headers: mergeWithRateLimitHeaders(
					{ 'Content-Type': 'application/json' },
					rateLimitResult,
				),
				status: 429,
			},
		);
	}

	const id = ctx.params.id;
	if (!id) {
		return new Response('Note ID is required', { status: 400 });
	}

	if (ctx.req.method === 'POST') {
		const note = await db.getNoteById(id);
		const { passwordHash } = await ctx.req.json();

		if (!note || !passwordHash) {
			return new Response('Note not found or password hash missing', { status: 404 });
		}

		if (note.password && !compareHash(passwordHash, note.password)) {
			return new Response('Invalid password or auth key', { status: 403 });
		}

		// If the note doesn't require manual deletion, delete it to ensure it has been destroyed
		if (!note.manualDeletion) {
			await db.deleteNote(id);
		}

		return new Response(
			JSON.stringify({
				id: note.id,
				content: note.content,
				iv: note.iv,
				expiresIn: note.expiresIn,
				manualDeletion: note.manualDeletion,
			} as Note),
			{
				headers: mergeWithRateLimitHeaders(
					{ 'Content-Type': 'application/json' },
					rateLimitResult,
				),
				status: 200,
			},
		);
	} else if (ctx.req.method === 'DELETE') {
		const note = await db.getNoteById(id);
		const { passwordHash } = await ctx.req.json();
		if (!note) {
			return new Response('Note not found', { status: 404 });
		}

		if (note.password && !compareHash(passwordHash, note.password)) {
			return new Response('Invalid password or auth key', { status: 403 });
		}
		await db.deleteNote(id);
		return new Response(
			JSON.stringify({
				message: 'Note deleted successfully',
			}),
			{
				headers: mergeWithRateLimitHeaders(
					{ 'Content-Type': 'application/json' },
					rateLimitResult,
				),
				status: 200,
			},
		);
	} else {
		return new Response('Method not allowed', { status: 405 });
	}
};

function compareHash(plainText: string, hash: string): boolean {
	try {
		return bcrypt.compareSync(plainText, hash);
	} catch (error) {
		console.error('Error comparing hash:', error);
		return false;
	}
}
