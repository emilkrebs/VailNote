import { createNoteSchema } from '../../lib/validation/note.ts';
import { formatExpiration, Note } from '../../lib/types.ts';
import { jsonError, jsonResponse } from '../../lib/http.ts';
import * as v from '@valibot/valibot';
import { Context } from 'fresh';
import * as bcrypt from 'bcrypt';
import { State } from '../../lib/types/common.ts';
import { noteDatabase } from '../../main.ts';
import { defaultLogger } from '../../lib/logging.ts';

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
        try {
            let body: Record<string, unknown>;
            try {
                body = await ctx.req.json();
            } catch {
                return jsonError(400, 'Invalid request body', 'INVALID_REQUEST_BODY');
            }

            const { content, iv, password, expiresIn, manualDeletion } = body as {
                content: string;
                iv: string;
                password?: string;
                expiresIn: string;
                manualDeletion?: boolean;
            };

            // Validate input using valibot
            try {
                v.parse(createNoteSchema, { content, iv, password, expiresIn, manualDeletion });
            } catch {
                return jsonError(400, 'Invalid request data', 'INVALID_DATA');
            }

            const noteId = await noteDatabase.generateNoteId();
            const hasPassword = password && password.trim() !== '';

            // if password is provided, hash it with bcrypt (password should be PBKDF2 hashed on client before sending)
            const passwordHash = hasPassword ? await generateHash(password) : undefined;

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
                defaultLogger.error(`Failed to save note: ${insertResult.error}`);
                return jsonError(500, 'Failed to save note', 'SAVE_FAILED');
            }

            return jsonResponse(
                {
                    message: 'Note saved successfully!',
                    noteId: noteId,
                },
                201,
            );
        } catch (error) {
            defaultLogger.error(`Unexpected error creating note: ${error instanceof Error ? error.message : error}`);
            return jsonError(500, 'Failed to process request', 'INTERNAL_ERROR');
        }
    },
};

async function generateHash(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
}
