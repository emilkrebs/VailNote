import { formatExpiration, generateRandomId } from '../../../types/types.ts';
import { decryptNoteContent } from '../../encryption.ts';
import { prepareEncryption } from '../crypto-service.ts';
import IndexedDBService from '../indexed-db-service.ts';
import {
	CreateNoteData,
	CreateNoteResult,
	DeleteNoteResult,
	GetEncryptedNoteResult,
	StorageProvider,
} from './storage-provider.ts';

export default class LocalVaultStorage implements StorageProvider {
	async create(data: CreateNoteData): Promise<CreateNoteResult> {
		const { content, password, expiresIn, manualDeletion } = data;

		if (!content.trim()) {
			return { success: false, message: 'Note content cannot be empty' };
		}

		try {
			const { encryptedContent, passwordHash, authKey } = await prepareEncryption(content, password);

			const noteId = generateRandomId(12);

			await IndexedDBService.add({
				id: noteId,
				content: encryptedContent.encrypted,
				iv: encryptedContent.iv,
				password: passwordHash || undefined,
				expiresIn: formatExpiration(expiresIn),
				manualDeletion: !!manualDeletion,
			});

			const link = password ? noteId : `${noteId}#auth=${authKey}`;
			return { success: true, noteId, authKey, message: 'Stored locally', link };
		} catch {
			return { success: false, message: 'Failed to create local note' };
		}
	}

	async get(noteId: string, password?: string): Promise<GetEncryptedNoteResult> {
		try {
			const note = await IndexedDBService.get(noteId);
			if (!note) return { success: false, message: 'Note not found' };

			const encryptionKey = password || noteId.split('#auth=')[1];
			if (!encryptionKey) {
				return { success: false, message: 'No decryption key provided' };
			}

			const decrypted = await decryptNoteContent(
				note.content,
				note.iv,
				encryptionKey,
			);

			return {
				success: true,
				note: {
					id: note.id,
					content: decrypted,
					expiresIn: note.expiresIn,
					manualDeletion: note.manualDeletion,
					iv: '',
				},
			};
		} catch {
			return { success: false, message: 'Failed to decrypt local note' };
		}
	}

	async delete(noteId: string): Promise<DeleteNoteResult> {
		try {
			await IndexedDBService.delete(noteId);
			return { success: true };
		} catch {
			return { success: false, message: 'Failed to delete local note' };
		}
	}
}
