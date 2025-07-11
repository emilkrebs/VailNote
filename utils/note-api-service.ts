import { generateRandomId, Note } from '../types/types.ts';
import { encryptNoteContent } from './encryption.ts';
import { generateDeterministicClientHash } from './hashing.ts';

interface DeleteNoteResult {
	success: boolean;
	message?: string;
}

interface GetEncryptedNoteResult {
	success: boolean;
	note?: Note;
	message?: string;
}

interface CreateNoteResult {
	success: boolean;
	noteId?: string;
	authKey?: string;
	message?: string;
}

interface CreateNoteData {
	noteContent: string;
	notePassword?: string;
	expiresIn: string;
	manualDeletion?: boolean;
}

export default class NoteAPIService {
	static async createNote(data: CreateNoteData): Promise<CreateNoteResult> {
		const { noteContent, notePassword, expiresIn, manualDeletion } = data;
		if (!noteContent || noteContent.trim() === '') {
			return { success: false, message: 'Note content cannot be empty' };
		}
		try {
			const hasPassword = notePassword && notePassword.trim() !== '';

			const firstAuth = !hasPassword ? generateRandomId(8) : undefined;
			const passwordHash = hasPassword ? await generateDeterministicClientHash(notePassword) : undefined;
			// encrypt the note content using the provided plain password or a random auth token
			const encryptionKey = notePassword || firstAuth;

			if (!encryptionKey) {
				return { success: false, message: 'No password or auth token provided' };
			}
			const encryptedContent = await encryptNoteContent(
				noteContent,
				encryptionKey,
			);

			const requestBody = {
				content: encryptedContent.encrypted,
				password: hasPassword ? passwordHash : null, // Password is PBKDF2 hashed before sending, then bcrypt hashed on server
				expiresAt: expiresIn,
				manualDeletion,
				iv: encryptedContent.iv,
			};

			const response = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});

			if (!response.ok) {
				return { success: false, message: await response.text(), authKey: firstAuth };
			}

			const data = await response.json();
			return { success: true, noteId: data.noteId, message: data.message, authKey: firstAuth };
		} catch (_err) {
			return { success: false, message: 'Failed to create note' };
		}
	}

	static async deleteNote(noteId: string, password: string): Promise<DeleteNoteResult> {
		try {
			const passwordHash = await generateDeterministicClientHash(password);
			const response = await fetch(`/api/notes/${noteId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ passwordHash }),
			});

			return response.ok ? { success: true } : { success: false, message: await response.text() };
		} catch (_err) {
			return { success: false, message: 'Failed to delete note' };
		}
	}

	static async getEncryptedNote(noteId: string, password: string): Promise<GetEncryptedNoteResult> {
		try {
			const passwordHash = await generateDeterministicClientHash(password);
			const response = await fetch(`/api/notes/${noteId}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ passwordHash }),
			});

			if (!response.ok) {
				return {
					success: false,
					message: await response.text(),
				};
			}

			const data = await response.json();
			return {
				success: true,
				note: data as Note,
			};
		} catch (_err) {
			return { success: false, message: 'Failed to fetch note' };
		}
	}
}
