import { createNoteServerSchema } from '../../lib/validation/note.ts';
import { formatExpiration, Note } from '../../lib/types.ts';
import { mergeWithRateLimitHeaders } from '../../lib/rate-limiting/rate-limit-headers.ts';
import * as v from '@valibot/valibot';
import { Context } from 'fresh';
import { getNoteDatabase, getRateLimiter } from '../../lib/services/database-service.ts';
import * as bcrypt from 'bcrypt';
import { State } from '../../main.ts';

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

export const handler = {
    async POST(ctx: Context<State>) {
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

        try {
            const { content, iv, password, authKey, expiresIn, manualDeletion } = await ctx.req.json();

            // Validate input using valibot
            try {
                v.parse(createNoteServerSchema, { content, iv, password, authKey, expiresIn, manualDeletion });
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

            const noteId = await db.generateNoteId();
            const hasPassword = password && password.trim() !== '';
            const hasAuthKey = authKey && authKey.trim() !== '';

            // Hash password and auth key with bcrypt for server storage
            const passwordHash = hasPassword ? generateHash(password) : undefined;
            const authKeyHash = hasAuthKey ? generateHash(authKey) : undefined;

            // check if content is encrypted
            const result: Note = {
                id: noteId,
                content, // content should be encrypted before sending to this endpoint
                password: passwordHash, // password is PBKDF2 deterministic hashed on client, then bcrypt hashed on server for secure storage
                authKey: authKeyHash, // auth key is PBKDF2 deterministic hashed on client, then bcrypt hashed on server for secure storage
                iv: iv,
                expiresIn: formatExpiration(expiresIn),
                manualDeletion: manualDeletion,
            };

            const insertResult = await db.insertNote(result);

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
    },
};

function generateHash(password: string): string {
    const salt = bcrypt.genSaltSync(12);
    return bcrypt.hashSync(password, salt);
}
