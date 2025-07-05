import '$std/dotenv/load.ts';
import { NoteDatabase } from './note-database.ts';

const uri = Deno.env.get('BASE_URI');
if (!uri) {
	throw new Error('BASE_URI is not set');
}

export const noteDatabase = new NoteDatabase(uri);

export async function initializeDatabase() {
	await noteDatabase.init();
}

export async function closeDatabase() {
	await noteDatabase.close();
}
