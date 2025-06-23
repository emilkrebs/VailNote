import { MongoClient } from "mongodb";
import { TerminalColors } from "../utils/logging.ts";
import { Note } from "../types/types.ts";
import { DatabaseLogger } from "./database-logger.ts";

export class NoteDatabase {
	BASE_URI: string;
	DATA_SOURCE: string;
	COLLECTION: string;
	logger: DatabaseLogger;
	_client: MongoClient;

	constructor(uri: string) {
		this.BASE_URI = uri;
		this.DATA_SOURCE = "vailnote";
		this.COLLECTION = "notes";

		this.logger = new DatabaseLogger();
		this.logger.log(TerminalColors.format(`Connecting to database. &8(${this.BASE_URI})&r`));
		this._client = new MongoClient(uri);
		this.logger.log(TerminalColors.format(`Succesfully connected to database. &8(${this.BASE_URI})&r`));
	}

	async init() {
		await this._client.connect();
		this.logger.log(TerminalColors.format(`Connected to database. &8(${this.BASE_URI})&r`));
		const db = this._client.db(this.DATA_SOURCE);
		const rooms = db.collection<Note>(this.COLLECTION);
		
		await rooms.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 1 });
		await rooms.createIndex({ "id": 1 }, { unique: true });
	}

    async insertNote(note: Note): Promise<void> {
		if (!this.isNoteValid(note)) {
			return this.logger.error(TerminalColors.format(`Invalid note provided. &8(${JSON.stringify(note)})&r`));
		}
		
        const db = this._client.db(this.DATA_SOURCE);
        const notes = db.collection<Note>(this.COLLECTION);
        await notes.insertOne(note);

		this.logger.log(TerminalColors.format(`Note inserted with id: &8(${note.id})&r`));
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

	isNoteValid(note: Note): boolean {
		if (!note || !note.id || !note.content || note.content === "" || !note.expiresAt) {
			return false;
		}
		return true;
	}

	/**
	 * Generate a note id that is not already in use
	 * @returns A unique note id (for Example: O5QJo8fZ)
	 */
	async generateNoteId(): Promise<string> {
		const db = this._client.db(this.DATA_SOURCE);
		const notes = db.collection<Note>(this.COLLECTION);
		let id = "";
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

	
}
