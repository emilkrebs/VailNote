import { NoteDatabase } from '../../database/note-database.ts';
import { ArcRateLimiter } from '../rate-limiting/arc-rate-limiter.ts';

const databasePath = Deno.env.get('DATABASE_PATH');

let _noteDatabase: NoteDatabase | null = null;
let _rateLimiter: ArcRateLimiter | null = null;

export async function getNoteDatabase() {
    if (!_noteDatabase) {
        console.log(`Database Path Source: ${databasePath ? 'env' : 'default'}`);
        _noteDatabase = await new NoteDatabase(databasePath).init();
    }
    return _noteDatabase;
}

export function getRateLimiter() {
    if (!_rateLimiter) {
        _rateLimiter = new ArcRateLimiter(
            10, // 10 requests per minute
            60 * 1000, // 1 minute window
            5 * 60 * 1000, // 5 minute block
        );
    }
    return _rateLimiter;
}
