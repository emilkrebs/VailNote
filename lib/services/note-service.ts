import RemoteStorage from './storage/remote-storage.ts';
import { CreateNoteData, StorageProvider } from './storage/storage-provider.ts';

/**
 * NoteService acts as a facade for note-related operations, abstracting the underlying storage mechanism on the client-side.
 * It currently uses RemoteStorage to interact with a backend API for creating, retrieving, and deleting notes.
 */
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
