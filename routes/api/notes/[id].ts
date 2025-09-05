import { FreshContext } from '$fresh/server.ts';
import { Note } from '../../../types/types.ts';
import { compareHash } from '../../../lib/hashing.ts';
import { mergeWithRateLimitHeaders } from '../../../lib/rate-limiting/rate-limit-headers.ts';
import { State } from '../../_middleware.ts';

export const handler = async (req: Request, ctx: FreshContext<State>): Promise<Response> => {
	if (req.method !== 'POST' && req.method !== 'DELETE') {
		return new Response('Method not allowed', { status: 405 });
	}

	const rateLimitResult = await ctx.state.context.getRateLimiter().checkRateLimit(req);
	const noteDatabase = ctx.state.context.getNoteDatabase();

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

	if (req.method === 'POST') {
		const note = await noteDatabase.getNoteById(id);
		const { passwordHash } = await req.json();

		if (!note || !passwordHash) {
			return new Response('Note not found or password hash missing', { status: 404 });
		}

		if (note.password && !compareHash(passwordHash, note.password)) {
			return new Response('Invalid password or auth key', { status: 403 });
		}

		// If the note doesn't require manual deletion, delete it to ensure it has been destroyed
		if (!note.manualDeletion) {
			await noteDatabase.deleteNote(id);
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
	} else if (req.method === 'DELETE') {
		const note = await noteDatabase.getNoteById(id);
		const { passwordHash } = await req.json();
		if (!note) {
			return new Response('Note not found', { status: 404 });
		}

		if (note.password && !compareHash(passwordHash, note.password)) {
			return new Response('Invalid password or auth key', { status: 403 });
		}
		await noteDatabase.deleteNote(id);
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
