import { NoteDatabase } from '../../database/note-database.ts';
import { ArcRateLimiter } from '../rate-limiting/arc-rate-limiter.ts';

const databaseUri = Deno.env.get('DATABASE_URI')!;

let _noteDatabase: NoteDatabase | null = null;
let _rateLimiter: ArcRateLimiter | null = null;

export async function getNoteDatabase() {
	const isBrowser = typeof window !== 'undefined';
	if (isBrowser) {
		throw new Error('getNoteDatabase should not be called in the browser environment.');
	}
	if (!_noteDatabase) {
		_noteDatabase = await new NoteDatabase(databaseUri).init();
	}
	return _noteDatabase;
}

export function getRateLimiter() {
	const isBrowser = typeof window !== 'undefined';
	if (isBrowser) {
		throw new Error('getRateLimiter should not be called in the browser environment.');
	}
	if (!_rateLimiter) {
		_rateLimiter = new ArcRateLimiter(
			10, // 10 requests per minute
			60 * 1000, // 1 minute window
			5 * 60 * 1000, // 5 minute block
		);
	}
	return _rateLimiter;
}
