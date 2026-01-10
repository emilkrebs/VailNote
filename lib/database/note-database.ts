import { Note } from '../types.ts';
import { TerminalColors } from '../logging.ts';
import { NOTE_CONTENT_MAX_LENGTH, NOTE_PASSWORD_MAX_LENGTH } from '../validation/note.ts';
import { DatabaseLogger } from './database-logger.ts';

export interface ValidateNoteResult {
    success: boolean;
    message?: string;
}

export interface InsertNoteResult {
    success: boolean;
    error?: string;
}

export class NoteDatabase {
    logger: DatabaseLogger;
    path?: string;
    private kv?: Deno.Kv;

    constructor(path?: string) {
        this.path = path;
        this.logger = new DatabaseLogger();
    }

    /**
     * Initialize Deno KV
     */
    async init(): Promise<NoteDatabase> {
        this.logger.log(
            TerminalColors.format('Opening Deno KV database...'),
        );
        this.kv = await Deno.openKv(this.path || undefined);
        this.logger.log(
            TerminalColors.format(`Successfully opened Deno KV database.`),
        );
        return this;
    }

    /**
     * Close the database connection
     */
    async close(): Promise<void> {
        if (this.kv) {
            try {
                await this.kv.close();
                this.logger.log(
                    TerminalColors.format(`Database connection closed.`),
                );
            } catch (error) {
                this.logger.log(
                    TerminalColors.format(
                        `Error closing database connection: ${error}`,
                    ),
                );
            }
        }
    }

    async insertNote(note: Note): Promise<InsertNoteResult> {
        if (!this.kv) {
            return { success: false, error: 'Database not initialized' };
        }

        const validationResult = this.validateNote(note);
        if (!validationResult.success) {
            return { success: false, error: validationResult.message };
        }

        // calculate duration in milliseconds until expiration
        const expiresInMs = note.expiresIn.getTime() - Date.now();
        await this.kv.set(['note', note.id], note, { expireIn: expiresInMs });
        return { success: true };
    }

    async deleteNote(id: string): Promise<void> {
        if (!this.kv) throw new Error('Database not initialized');
        await this.kv.delete(['note', id]);
    }

    async getNoteById(id: string): Promise<Note | null> {
        if (!this.kv) throw new Error('Database not initialized');
        const entry = await this.kv.get<Note>(['note', id]);
        return entry.value ?? null;
    }

    validateNote(data: Note): ValidateNoteResult {
        if (!data.content || !data.iv || !data.expiresIn) {
            return {
                success: false,
                message: 'Content, IV, and expiration time are required',
            };
        }

        // Security: Limit input sizes to prevent DoS
        if (data.content.length > NOTE_CONTENT_MAX_LENGTH) {
            return {
                success: false,
                message: 'Content too large (max 1MB)',
            };
        }

        if (data.password && data.password.length > NOTE_PASSWORD_MAX_LENGTH) {
            return {
                success: false,
                message: 'Password too long (max 256 characters)',
            };
        }

        return { success: true };
    }

    /**
     * Generate a unique note ID that doesn't collide
     */
    async generateNoteId(): Promise<string> {
        if (!this.kv) throw new Error('Database not initialized');

        const MAX_ATTEMPTS = 5;
        const BASE_LENGTH = 12; // Start with longer IDs to reduce collisions

        for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
            const length = BASE_LENGTH + Math.floor(attempt / 2); // Increase length after failed attempts
            const id = crypto.randomUUID().replace(/-/g, '').substring(0, length);

            const res = await this.kv.get<Note>(['note', id]);
            if (!res.value) {
                return id;
            }
        }

        // Fallback to timestamp-based ID if all attempts fail
        return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }

    async clearAllNotes(): Promise<void> {
        if (!this.kv) throw new Error('Database not initialized');

        const iter = this.kv.list<Note>({ prefix: ['note'] });
        for await (const entry of iter) {
            await this.kv.delete(entry.key);
        }

        this.logger.log(
            TerminalColors.format(`All notes cleared from Deno KV.`),
        );
    }
}
