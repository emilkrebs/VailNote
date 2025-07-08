import { NoteDatabase } from '../database/note-database.ts';

/**
 * Test database helper that creates an isolated database instance for testing
 */
export class TestNoteDatabase {
	private static instance: NoteDatabase | null = null;

	static async getInstance(): Promise<NoteDatabase> {
		if (!this.instance) {
			// Use a test database URI or in-memory database for tests
			const testUri = Deno.env.get('TEST_BASE_URI') || Deno.env.get('BASE_URI');
			if (!testUri) {
				throw new Error('TEST_BASE_URI or BASE_URI must be set for testing');
			}

			this.instance = new NoteDatabase(testUri);
			await this.instance.init();
		}
		return this.instance;
	}

	static async cleanup(): Promise<void> {
		if (this.instance) {
			try {
				await this.instance.close();
			} catch (error) {
				console.error('Error closing database:', error);
			}
			this.instance = null;
		}
	}

	static async reset(): Promise<void> {
		await this.cleanup();
		// Force a new instance on next getInstance call
	}

	static async clearAllNotes(): Promise<void> {
		if (this.instance) {
			await this.instance.clearAllNotes();
		}
	}
}
