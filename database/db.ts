import '$std/dotenv/load.ts';
import { NoteDatabase } from './note-database.ts';

const uri = Deno.env.get('BASE_URI');
if (!uri) {
	throw new Error('BASE_URI is not set');
}

export let noteDatabase = new NoteDatabase(uri);

export async function initializeDatabase(testInstance?: NoteDatabase) {
	if (testInstance) {
		noteDatabase = testInstance;
	}
	await noteDatabase.init();
}

export async function closeDatabase() {
	await noteDatabase.close();
}
