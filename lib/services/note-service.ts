import LocalVaultStorage from './storage/local-vault-storage.ts';
import RemoteStorage from './storage/remote-storage.ts';
import { CreateNoteData, StorageProvider } from './storage/storage-provider.ts';

export default class NoteService {
	private static provider: StorageProvider = new RemoteStorage();

	static useLocalVault(enable: boolean) {
		console.log(`Switching to ${enable ? 'LocalVaultStorage' : 'RemoteStorage'}`);
		this.provider = enable ? new LocalVaultStorage() : new RemoteStorage();
	}

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
