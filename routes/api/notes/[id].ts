import { Note } from '../../../lib/types.ts';
import { Context } from 'fresh';
import { getNoteDatabase } from '../../../lib/services/database-service.ts';
import * as bcrypt from 'bcrypt';
import { State } from '../../../lib/types/common.ts';

export const handler = async (ctx: Context<State>): Promise<Response> => {
    if (ctx.req.method !== 'POST' && ctx.req.method !== 'DELETE') {
        return new Response('Method not allowed', { status: 405 });
    }
    const db = await getNoteDatabase();

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
