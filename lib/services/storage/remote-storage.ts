import { generateDeterministicClientHash } from '../../hashing.ts';
import { prepareEncryption } from '../crypto-service.ts';
import {
	CreateNoteData,
	CreateNoteResult,
	DeleteNoteResult,
	GetEncryptedNoteResult,
	StorageProvider,
} from './storage-provider.ts';

export interface ApiNoteRequest {
	content: string;
	iv: string;
	password?: string;
	expiresIn?: string;
	manualDeletion?: boolean;
}

/**
 * RemoteStorage implements the StorageProvider interface to interact with a backend API for note storage.
 * It handles creating, retrieving, and deleting notes by making HTTP requests to the appropriate endpoints.
 */
export default class RemoteStorage implements StorageProvider {
	async create(data: CreateNoteData): Promise<CreateNoteResult> {
		const { content, password, expiresIn, manualDeletion } = data;

		if (!content.trim()) {
			return { success: false, message: 'Note content cannot be empty' };
		}

		try {
			const { encryptedContent, passwordHash, authKey } = await prepareEncryption(content, password);

			const response = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					content: encryptedContent.encrypted,
					password: passwordHash,
					expiresIn,
					manualDeletion,
					iv: encryptedContent.iv,
				} as ApiNoteRequest),
			});

			if (!response.ok) {
				return { success: false, message: await response.text(), authKey };
			}

			const { noteId, ...res } = await response.json();
			const link = password ? noteId : `${noteId}#auth=${authKey}`;

			return { success: true, noteId, authKey, message: res.message, link };
		} catch (_err) {
			return { success: false, message: 'Failed to create note' };
		}
	}

	async get(noteId: string, password?: string): Promise<GetEncryptedNoteResult> {
		try {
			const passwordHash = password ? await generateDeterministicClientHash(password) : undefined;

			const response = await fetch(`/api/notes/${noteId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ passwordHash }),
			});

			if (!response.ok) {
				return { success: false, message: await response.text() };
			}

			const note = await response.json();
			return { success: true, note };
		} catch {
			return { success: false, message: 'Failed to fetch note' };
		}
	}

	async delete(noteId: string, password: string): Promise<DeleteNoteResult> {
		try {
			const passwordHash = await generateDeterministicClientHash(password);
			const response = await fetch(`/api/notes/${noteId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ passwordHash }),
			});

			return response.ok ? { success: true } : { success: false, message: await response.text() };
		} catch {
			return { success: false, message: 'Failed to delete note' };
		}
	}
}
