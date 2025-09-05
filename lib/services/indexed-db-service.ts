// services/IndexedDBService.ts
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { Note } from '../../types/types.ts';

interface VaultDB extends DBSchema {
	vault_notes: {
		key: string;
		value: Note;
		indexes: { 'by-expiry': number };
	};
}

class IndexedDBService {
	private static dbPromise: Promise<IDBPDatabase<VaultDB>>;

	static init() {
		if (!this.dbPromise) {
			this.dbPromise = openDB<VaultDB>('VailNoteVault', 1, {
				upgrade(db) {
					const store = db.createObjectStore('vault_notes', { keyPath: 'id' });
					store.createIndex('by-expiry', 'expiresIn');
				},
			});
		}
		return this.dbPromise;
	}

	static async add(note: Note) {
		const db = await this.init();
		await db.put('vault_notes', note);
	}

	static async get(id: string) {
		const db = await this.init();
		return db.get('vault_notes', id);
	}

	static async getAll() {
		const db = await this.init();
		return db.getAll('vault_notes');
	}

	static async delete(id: string) {
		const db = await this.init();
		await db.delete('vault_notes', id);
	}

	static async clearExpired() {
		const db = await this.init();
		const tx = db.transaction('vault_notes', 'readwrite');
		const index = tx.store.index('by-expiry');
		const now = new Date();
		let cursor = await index.openCursor();
		while (cursor) {
			if (cursor.value.expiresIn && cursor.value.expiresIn < now) {
				await cursor.delete();
			}
			cursor = await cursor.continue();
		}
		await tx.done;
	}
}

export default IndexedDBService;
