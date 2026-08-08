import { Note } from '../../../lib/types.ts';
import { Context } from 'fresh';
import * as bcrypt from 'bcrypt';
import { State } from '../../../lib/types/common.ts';
import { noteDatabase } from '../../../main.ts';
import { jsonError, jsonResponse } from '../../../lib/http.ts';

async function validateNoteAccess(
    id: string,
    passwordHash?: string,
    authKeyHash?: string,
): Promise<{ note: Note | null; error?: Response }> {
    const note = await noteDatabase.getNoteById(id);

    // if the note does not exist, return a 404 error
    if (!note) {
        return {
            note: null,
            error: jsonError(404, 'Note not found', 'NOTE_NOT_FOUND'),
        };
    }

    // If the note is password-protected, a valid password hash is REQUIRED.
    // Do not fail open when the caller omits the hash.
    if (note.password) {
        if (!passwordHash || !(await compareHash(passwordHash, note.password))) {
            // If the password hash is missing or does not match, return a 403 error
            return {
                note: null,
                error: jsonError(403, 'Invalid password or auth key', 'INVALID_PASSWORD_OR_AUTH_KEY'),
            };
        }
    } else if (note.authKeyHash) {
        // Passwordless notes created with an auth-key verifier: possession of
        // the link (note ID + auth key) is required to fetch or delete.
        // Do not fail open when the caller omits the hash.
        if (!authKeyHash || !(await compareHash(authKeyHash, note.authKeyHash))) {
            return {
                note: null,
                error: jsonError(403, 'Invalid password or auth key', 'INVALID_PASSWORD_OR_AUTH_KEY'),
            };
        }
    }
    // Legacy notes (created without any verifier) remain addressable by ID
    // alone until they expire - the server never learned a verifier for them.

    return { note };
}

export const handler = async (ctx: Context<State>): Promise<Response> => {
    if (ctx.req.method !== 'POST' && ctx.req.method !== 'DELETE') {
        return jsonError(405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
    }

    const id = ctx.params.id;
    if (!id) {
        return jsonError(400, 'Note ID is required', 'NOTE_ID_REQUIRED');
    }

    let passwordHash: string | undefined;
    let authKeyHash: string | undefined;
    try {
        const body = await ctx.req.json();
        passwordHash = body?.passwordHash;
        authKeyHash = body?.authKeyHash;
    } catch {
        return jsonError(400, 'Invalid request body', 'INVALID_REQUEST_BODY');
    }

    const { note, error } = await validateNoteAccess(id, passwordHash, authKeyHash);

    if (error) return error;
    if (!note) return jsonError(404, 'Note not found', 'NOTE_NOT_FOUND');

    if (ctx.req.method === 'POST') {
        // Auto-delete non-manual notes after viewing
        if (!note.manualDeletion) {
            await noteDatabase.deleteNote(id);
        }

        return jsonResponse(note, 200);
    } else { // DELETE
        await noteDatabase.deleteNote(id);
        return jsonResponse({ message: 'Note deleted successfully' }, 200);
    }
};

async function compareHash(plainText: string, hash: string): Promise<boolean> {
    try {
        return await bcrypt.compare(plainText, hash);
    } catch (error) {
        console.error('Error comparing hash:', error);
        return false;
    }
}
