import { NoteDatabase } from './database/note-database.ts';
import { ArcRateLimiter } from './lib/rate-limiting/arc-rate-limiter.ts';

export interface ContextOptions {
	testMode: boolean;
	databaseUri?: string;
}

export class VailnoteContext {
	private static context: VailnoteContext;
	private noteDatabase: NoteDatabase | undefined;
	private rateLimiter: ArcRateLimiter | undefined;

	options: ContextOptions | undefined;

	public constructor() {
		if (!this.options) throw new Error('Context options must be set before initializing resources');

		VailnoteContext.context.initializeResources(this.options);
	}

	private async initializeResources(options: ContextOptions) {
		console.log('Initializing context resources...');
		try {
			const uri = options.databaseUri;
			if (!uri) {
				throw new Error('Database URI must be provided in options');
			}

			// Safety check: prevent using production database during tests
			if (options.testMode && !uri.includes('_test')) {
				throw new Error('Test database URI must contain "_test" to prevent accidentally using production database');
			}

			this.noteDatabase = new NoteDatabase(uri);
			this.rateLimiter = this.getDefaultArcRateLimiter();
			await this.noteDatabase.init();
		} catch (error) {
			throw new Error(`Failed to initialize context: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	private getDefaultArcRateLimiter(): ArcRateLimiter {
		if (this.rateLimiter) {
			return this.rateLimiter; // Return existing instance if already initialized
		}

		return new ArcRateLimiter(
			10, // 10 requests per minute
			60 * 1000, // 1 minute window
			5 * 60 * 1000, // 5 minute block
			!this.options?.testMode, // Disable periodic cleanup in test mode
		);
	}

	public static instance() {
		if (this.context) return this.context;
		else throw new Error('Context is not initialized!');
	}

	public getNoteDatabase(): NoteDatabase {
		if (!this.noteDatabase) {
			throw new Error('Database not initialized in context');
		}
		return this.noteDatabase;
	}

	public getRateLimiter(): ArcRateLimiter {
		if (!this.rateLimiter) {
			throw new Error('Rate limiter not initialized in context');
		}
		return this.rateLimiter;
	}

	public async cleanup() {
		console.log('Cleaning up context resources...');
		if (this.rateLimiter) {
			this.rateLimiter.destroy();
			this.rateLimiter = undefined;
		}

		// Clean up database connection
		if (this.noteDatabase) {
			await this.noteDatabase.close();
		}
		this.noteDatabase = undefined;
	}

	public isTestMode(): boolean {
		return this.options?.testMode || false;
	}
}
