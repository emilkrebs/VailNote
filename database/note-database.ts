import { MongoClient } from 'mongodb';
import { TerminalColors } from '../lib/logging.ts';
import { Note } from '../types/types.ts';
import { DatabaseLogger } from './database-logger.ts';
import { NOTE_CONTENT_MAX_LENGTH, NOTE_PASSWORD_MAX_LENGTH } from '../lib/validation/note.ts';

export interface ValidateNoteResult {
	success: boolean;
	message?: string;
}

export interface InsertNoteResult {
	success: boolean;
	error?: string;
}

export class NoteDatabase {
	BASE_URI: string;
	DATA_SOURCE: string;
	COLLECTION: string;
	logger: DatabaseLogger;
	_client: MongoClient;

	constructor(uri: string) {
		this.BASE_URI = uri;
		this.DATA_SOURCE = 'vailnote';
		this.COLLECTION = 'notes';

		this.logger = new DatabaseLogger();
		this.logger.log(
			TerminalColors.format(`Connecting to database. &8(${this.BASE_URI})&r`),
		);
		this._client = new MongoClient(uri);
	}

	/**
	 * Initialize the database connection and create necessary indexes
	 */
	async init() {
		await this._client.connect();
		this.logger.log(
			TerminalColors.format(
				`Successfully connected to database. &8(${this.BASE_URI})&r`,
			),
		);
		const db = this._client.db(this.DATA_SOURCE);
		const rooms = db.collection<Note>(this.COLLECTION);

		await rooms.createIndex({ 'expiresIn': 1 }, { expireAfterSeconds: 1 });
		await rooms.createIndex({ 'id': 1 }, { unique: true });
	}

	/**
	 * Close the database connection
	 */
	async close(): Promise<void> {
		if (this._client) {
			try {
				// Force close the client and wait for it to complete
				await this._client.close();
				this.logger.log(
					TerminalColors.format(`Database connection closed. &8(${this.BASE_URI})&r`),
				);
			} catch (error) {
				this.logger.log(
					TerminalColors.format(`Error closing database connection: ${error} &8(${this.BASE_URI})&r`),
				);
			}
		}
	}

	async insertNote(note: Note): Promise<InsertNoteResult> {
		const validationResult = this.validateNote(note);
		if (!validationResult.success) {
			return { success: false, error: validationResult.message };
		}

		const db = this._client.db(this.DATA_SOURCE);
		const notes = db.collection<Note>(this.COLLECTION);
		await notes.insertOne(note);

		return { success: true };
	}

	async deleteNote(id: string): Promise<void> {
		const db = this._client.db(this.DATA_SOURCE);
		const notes = db.collection<Note>(this.COLLECTION);
		await notes.deleteOne({
			id: id,
		});
	}

	async getNoteById(id: string): Promise<Note | null> {
		const db = this._client.db(this.DATA_SOURCE);
		const notes = db.collection<Note>(this.COLLECTION);
		return await notes.findOne({
			id: id,
		});
	}

	validateNote(data: Note): ValidateNoteResult {
		if (!data.content || !data.iv || !data.expiresIn) {
			return { success: false, message: 'Content, IV, and expiration time are required' };
		}

		// Security: Limit input sizes to prevent DoS
		if (data.content.length > NOTE_CONTENT_MAX_LENGTH) {
			return { success: false, message: 'Content too large (max 1MB)' };
		}

		if (data.password && data.password.length > NOTE_PASSWORD_MAX_LENGTH) {
			return { success: false, message: 'Password too long (max 256 characters)' };
		}

		return { success: true };
	}

	/**
	 * Generate a note id that is not already in use
	 * @returns A unique note id (for Example: O5QJo8fZ)
	 */
	async generateNoteId(): Promise<string> {
		const db = this._client.db(this.DATA_SOURCE);
		const notes = db.collection<Note>(this.COLLECTION);
		let id = '';
		let note = null;
		let attempts = 0;
		let length = 10; // Start with a length of 10 characters
		do {
			attempts++;
			if (attempts > 10) {
				length++;
			}
			id = Math.random().toString(36).substring(2, length + 2);
			// Check if the note with this id already exists
			note = await notes.findOne({
				id: id,
			});
		} while (note);

		return id;
	}

	async clearAllNotes(): Promise<void> {
		const db = this._client.db(this.DATA_SOURCE);
		const notes = db.collection<Note>(this.COLLECTION);
		await notes.deleteMany({});
		this.logger.log(
			TerminalColors.format(`All notes cleared from database. &8(${this.BASE_URI})&r`),
		);
	}
}
