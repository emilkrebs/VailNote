import { FreshContext } from '$fresh/server.ts';
import { mergeWithRateLimitHeaders } from '../../../utils/rate-limiting/rate-limit-headers.ts';
import { State } from '../../_middleware.ts';

export const handler = async (req: Request, ctx: FreshContext<State>): Promise<Response> => {
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

	if (req.method === 'GET') {
		const note = await noteDatabase.getNoteById(id);
		if (!note) {
			return new Response('Note not found', { status: 404 });
		}
		return new Response(
			JSON.stringify({
				id: note.id,
				content: note.content,
				iv: note.iv,
				expiresAt: note.expiresAt,
			}),
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
		if (!note) {
			return new Response('Note not found', { status: 404 });
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