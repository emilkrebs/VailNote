import { Note } from '../types/types.ts';
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

export default class NoteAPIService {
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
