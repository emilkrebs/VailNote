import '$std/dotenv/load.ts';
import { defaultLogger } from '../utils/logging.ts';
import { NoteDatabase } from './note-database.ts';

let noteDatabase: NoteDatabase | undefined = undefined;

export async function initializeDatabase(testInstance?: NoteDatabase) {
	if (testInstance) {
		noteDatabase = testInstance;
	} else {
		const uri = Deno.env.get('BASE_URI');
		if (!uri) {
			throw new Error('BASE_URI is not set');
		}

		noteDatabase = new NoteDatabase(uri);
	}
	await noteDatabase.init();
}

export function getNoteDatabase(): NoteDatabase {
	if (!noteDatabase) {
		throw new Error('Database not initialized. Call initializeDatabase first.');
	}
	return noteDatabase;
}

export async function closeDatabase() {
	if (noteDatabase) {
		await noteDatabase.close();
		noteDatabase = undefined;
	} else {
		defaultLogger.warn('No database connection to close.');
	}
}
