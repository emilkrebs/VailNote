import { NoteDatabase } from '../../database/note-database.ts';
import { ArcRateLimiter } from '../rate-limiting/arc-rate-limiter.ts';

// Use DATABASE_URI from environment variables in production, otherwise undefined for local development
const isProd = import.meta.env.PROD;

console.log(`Environment: ${isProd ? 'production' : 'development'}`);
const databaseUri = isProd ? Deno.env.get('DATABASE_URI') : undefined;

if(isProd && !databaseUri) {
	throw new Error('DATABASE_URI environment variable is required in production.');
}
let _noteDatabase: NoteDatabase | null = null;
let _rateLimiter: ArcRateLimiter | null = null;

export async function getNoteDatabase() {
	if (!_noteDatabase) {

		console.log(`Database URI Source: ${databaseUri ? 'env' : 'default'}`);
		_noteDatabase = await new NoteDatabase(databaseUri).init();
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
