import RemoteStorage from './storage/remote-storage.ts';
import { CreateNoteData, StorageProvider } from './storage/storage-provider.ts';

export default class NoteService {
	private static provider: StorageProvider = new RemoteStorage();

	static createNote(data: CreateNoteData) {
		return this.provider.create(data);
	}

	static getNote(noteId: string, password?: string) {
		return this.provider.get(noteId, password);
	}

	static deleteNote(noteId: string, password?: string) {
		return this.provider.delete(noteId, password);
	}
}
