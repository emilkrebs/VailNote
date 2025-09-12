import { Note } from '../../../lib/types.ts';
import { mergeWithRateLimitHeaders } from '../../../lib/rate-limiting/rate-limit-headers.ts';
import { Context } from 'fresh';
import { getNoteDatabase, getRateLimiter } from '../../../lib/services/database-service.ts';
import * as bcrypt from 'bcrypt';
import { State } from '../../../main.ts';

export const handler = async (ctx: Context<State>): Promise<Response> => {
    if (ctx.req.method !== 'POST' && ctx.req.method !== 'DELETE') {
        return new Response('Method not allowed', { status: 405 });
    }

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

    const id = ctx.params.id;
    if (!id) {
        return new Response('Note ID is required', { status: 400 });
    }

    if (ctx.req.method === 'POST') {
        const note = await db.getNoteById(id);
        const { passwordHash, authKeyHash } = await ctx.req.json();

        if (!note) {
            return new Response('Note not found', { status: 404 });
        }

        // Check authentication - need either password+authKey combo or just authKey (for legacy notes)
        let isAuthenticated = false;

        if (note.password && note.authKey) {
            // Note requires both password and auth key
            if (passwordHash && authKeyHash) {
                isAuthenticated = compareHash(passwordHash, note.password) && compareHash(authKeyHash, note.authKey);
            }
        } else if (note.authKey && !note.password) {
            // Note only requires auth key (legacy or no-password notes)
            if (authKeyHash) {
                isAuthenticated = compareHash(authKeyHash, note.authKey);
            }
        } else if (note.password && !note.authKey) {
            // Legacy note with only password (shouldn't happen with new system but handle gracefully)
            if (passwordHash) {
                isAuthenticated = compareHash(passwordHash, note.password);
            }
        }

        if (!isAuthenticated) {
            return new Response('Invalid authentication credentials', { status: 403 });
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
                headers: mergeWithRateLimitHeaders(
                    { 'Content-Type': 'application/json' },
                    rateLimitResult,
                ),
                status: 200,
            },
        );
    } else if (ctx.req.method === 'DELETE') {
        const note = await db.getNoteById(id);
        const { passwordHash, authKeyHash } = await ctx.req.json();
        if (!note) {
            return new Response('Note not found', { status: 404 });
        }

        // Check authentication for deletion - same logic as retrieval
        let isAuthenticated = false;

        if (note.password && note.authKey) {
            // Note requires both password and auth key
            if (passwordHash && authKeyHash) {
                isAuthenticated = compareHash(passwordHash, note.password) && compareHash(authKeyHash, note.authKey);
            }
        } else if (note.authKey && !note.password) {
            // Note only requires auth key (legacy or no-password notes)
            if (authKeyHash) {
                isAuthenticated = compareHash(authKeyHash, note.authKey);
            }
        } else if (note.password && !note.authKey) {
            // Legacy note with only password (shouldn't happen with new system but handle gracefully)
            if (passwordHash) {
                isAuthenticated = compareHash(passwordHash, note.password);
            }
        }

        if (!isAuthenticated) {
            return new Response('Invalid authentication credentials', { status: 403 });
        }

        await db.deleteNote(id);
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

function compareHash(plainText: string, hash: string): boolean {
    try {
        return bcrypt.compareSync(plainText, hash);
    } catch (error) {
        console.error('Error comparing hash:', error);
        return false;
    }
}
