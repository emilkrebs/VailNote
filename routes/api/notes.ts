import { createNoteSchema } from '../../lib/validation/note.ts';
import { formatExpiration, Note } from '../../lib/types.ts';
import * as v from '@valibot/valibot';
import { Context } from 'fresh';
import { getNoteDatabase } from '../../lib/services/database-service.ts';
import * as bcrypt from 'bcrypt';
import { State } from '../../lib/types/common.ts';

/* used for client side note creation and encryption
	* This endpoint handles only POST requests.
	* - POST: Creates a new note with the provided content, IV, password, and expiration time.
	*
	* Note: The content should be encrypted before sending to this endpoint and the password should be hashed with PBKDF2
	* on the client side for security, then securely hashed with bcrypt on the server for storage.
	*
	* rate-limiting (ARC - Anonymous Rate-Limited Credentials):
	* - Limit: 10 requests per minute per client
	* - Block duration: 5 minutes for rate limit violations
	* - Privacy-preserving: Uses anonymous tokens with daily rotation
	* - No IP address storage: Only hashed, rotated tokens are kept
	*/

export const handler = {
    async POST(ctx: Context<State>) {
        const db = await getNoteDatabase();

        try {
            const { content, iv, password, expiresIn, manualDeletion } = await ctx.req.json();

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
                        status: 400,
                    },
                );
            }

            const noteId = await db.generateNoteId();
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

            const insertResult = await db.insertNote(result);

            if (!insertResult.success) {
                return new Response(
                    JSON.stringify({
                        message: 'Failed to save note',
                        error: insertResult.error,
                    }),
                    {
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
