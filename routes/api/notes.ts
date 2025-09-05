import { FreshContext } from '$fresh/server.ts';
import { createNoteSchema } from '../../lib/validation/note.ts';
import { formatExpiration, Note } from '../../types/types.ts';
import { generateHash } from '../../lib/hashing.ts';
import { mergeWithRateLimitHeaders } from '../../lib/rate-limiting/rate-limit-headers.ts';
import { State } from '../_middleware.ts';
import * as v from '@valibot/valibot';

/* used for client side note creation and encryption
	* This endpoint handles only POST requests.
	* - POST: Creates a new note with the provided content, IV, password, and expiration time.
	*
	* Note: The content should be encrypted before sending to this endpoint and the password should be hashed with PBKDF2
	* on the client side for security, then securely hashed with bcrypt on the server for storage.
	*
	* Rate Limiting (ARC - Anonymous Rate-Limited Credentials):
	* - Limit: 10 requests per minute per client
	* - Block duration: 5 minutes for rate limit violations
	* - Privacy-preserving: Uses anonymous tokens with daily rotation
	* - No IP address storage: Only hashed, rotated tokens are kept
	*/

export const handler = async (req: Request, ctx: FreshContext<State>): Promise<Response> => {
	if (req.method !== 'POST') {
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

	try {
		const { content, iv, password, expiresIn, manualDeletion } = await req.json();

		// Validate input using valibot
		try {
			v.parse(createNoteSchema, { content, iv, password, expiresIn, manualDeletion });
		} catch (err) {
			return new Response(
				JSON.stringify({
					message: 'Invalid request data',
					error: err instanceof Error ? err.message : 'Unknown error',
				}),
				{
					headers: mergeWithRateLimitHeaders(
						{ 'Content-Type': 'application/json' },
						rateLimitResult,
					),
					status: 400,
				},
			);
		}

		const noteId = await noteDatabase.generateNoteId();
		const hasPassword = password && password.trim() !== '';

		// if password is provided, hash it with bcrypt (password should be PBKDF2 hashed on client before sending)
		const passwordHash = hasPassword ? generateHash(password) : undefined;

		// check if content is encrypted
		const result: Note = {
			id: noteId,
			content, // content should be encrypted before sending to this endpoint
			password: passwordHash, // password is PBKDF2 non-deterministic hashed on client, then bcrypt hashed on server for secure storage
			iv: iv,
			expiresIn: formatExpiration(expiresIn),
			manualDeletion: manualDeletion,
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
			}),
			{
				headers: mergeWithRateLimitHeaders(
					{ 'Content-Type': 'application/json' },
					rateLimitResult,
				),
				status: 201,
			},
		);
	} catch (error) {
		// Unexpected error handling
		return new Response(
			JSON.stringify({
				message: 'Failed to process request',
				error: error instanceof Error ? error.message : 'Unknown error',
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
};
