import { NoteDatabase } from '../database/note-database.ts';
import { defaultLogger } from '../logging.ts';

const databasePath = Deno.env.get('DATABASE_PATH');

let _noteDatabase: NoteDatabase | null = null;

export async function getNoteDatabase() {
    if (!_noteDatabase) {
        defaultLogger.log(`Database Path Source: ${databasePath ? 'env' : 'default'}`);
        _noteDatabase = await new NoteDatabase(databasePath).init();
    }
    return _noteDatabase;
}
