import { FreshContext } from '$fresh/server.ts';
import { formatExpiration, Note } from '../../types/types.ts';
import { generateHash } from '../../utils/hashing.ts';
import { mergeWithRateLimitHeaders } from '../../utils/rate-limiting/rate-limit-headers.ts';
import { State } from '../_middleware.ts';

/* used for client side note creation and encryption
    * This endpoint handles both GET and POST requests.
    * - GET: Fetches a note by its ID.
    * - POST: Creates a new note with the provided content, IV, password, and expiration time.
    *
    * Note: The content should be encrypted before sending to this endpoint and the password should be hashed with SHA-256.
    *
    * Rate Limiting (ARC - Anonymous Rate-Limited Credentials):
    * - Limit: 10 requests per minute per client
    * - Block duration: 5 minutes for rate limit violations
    * - Privacy-preserving: Uses anonymous tokens with daily rotation
    * - No IP address storage: Only hashed, rotated tokens are kept
    */

export const handler = async (req: Request, ctx: FreshContext<State>): Promise<Response> => {
	if (req.method !== 'POST' && req.method !== 'GET') {
		return new Response('Method not allowed', { status: 405 });
	}

	if (req.method === 'GET') {
		return new Response('GET method not implemented', { status: 501 });
	}

	const rateLimitResult = await ctx.state.context.getRateLimiter().checkRateLimit(req);
	const noteDatabase = ctx.state.context.getNoteDatabase();

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

	const { content, iv, password, expiresAt } = await req.json();

	const noteId = await noteDatabase.generateNoteId();

	// if password is provided, hash it (password should be hashed with SHA-256 before sending to this endpoint)
	const passwordHash = password ? await generateHash(password) : undefined;

	// check if content is encrypted
	const result: Note = {
		id: noteId,
		content, // content should be encrypted before sending to this endpoint
		password: passwordHash, // password should be hashed before sending to this endpoint
		iv: iv,
		expiresAt: formatExpiration(expiresAt),
	};

	const insertResult = await noteDatabase.insertNote(result);

	if (!insertResult.success) {
		return new Response(
			JSON.stringify({
				message: 'Failed to save note',
				error: insertResult.error,
			}),
			{
				headers: mergeWithRateLimitHeaders(
					{ 'Content-Type': 'application/json' },
					rateLimitResult,
				),
				status: 500,
			},
		);
	}

	return new Response(
		JSON.stringify({
			message: 'Note saved successfully!',
			noteId: noteId,
			noteLink: `${new URL(req.url).origin}/${noteId}`,
		}),
		{
			headers: mergeWithRateLimitHeaders(
				{ 'Content-Type': 'application/json' },
				rateLimitResult,
			),
			status: 201,
		},
	);
};
