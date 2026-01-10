import { Note } from '../../../lib/types.ts';
import { Context } from 'fresh';
import * as bcrypt from 'bcrypt';
import { State } from '../../../lib/types/common.ts';
import { noteDatabase } from '../../../main.ts';

async function validateNoteAccess(id: string, passwordHash?: string): Promise<{ note: Note | null; error?: Response }> {
    const note = await noteDatabase.getNoteById(id);

    if (!note) {
        return {
            note: null,
            error: new Response('Note not found', { status: 404 }),
        };
    }

    if (note.password && passwordHash && !(await compareHash(passwordHash, note.password))) {
        return {
            note: null,
            error: new Response('Invalid password or auth key', { status: 403 }),
        };
    }

    return { note };
}

export const handler = async (ctx: Context<State>): Promise<Response> => {
    if (ctx.req.method !== 'POST' && ctx.req.method !== 'DELETE') {
        return new Response('Method not allowed', { status: 405 });
    }

    const id = ctx.params.id;
    if (!id) {
        return new Response('Note ID is required', { status: 400 });
    }

    const { passwordHash } = await ctx.req.json();
    const { note, error } = await validateNoteAccess(id, passwordHash);

    if (error) return error;
    if (!note) return new Response('Note not found', { status: 404 });

    if (ctx.req.method === 'POST') {
        // Auto-delete non-manual notes after viewing
        if (!note.manualDeletion) {
            await noteDatabase.deleteNote(id);
        }

        return new Response(
            JSON.stringify(note),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    } else { // DELETE
        await noteDatabase.deleteNote(id);
        return new Response(
            JSON.stringify({ message: 'Note deleted successfully' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            },
        );
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
