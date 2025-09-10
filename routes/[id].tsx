import { Context } from 'fresh';
import { Note } from '../types/types.ts';
import Header from '../components/Header.tsx';
import ViewEncryptedNote from '../islands/ViewNote.tsx';
import { HttpError } from 'fresh';
import { getNoteDatabase } from '../lib/services/database-service.ts';

interface NotePageProps {
	note: Note;
	message?: string;
}

export const handler = {
	async GET(ctx: Context<unknown>) {
		const { id } = ctx.params;
		if (!id) {
			throw new HttpError(404);
		}

		const db = await getNoteDatabase();
		const note = await db.getNoteById(id);

		if (!note) {
			throw new HttpError(404);
		}

		// Always render the client-side component for zero-knowledge architecture
		// The client will handle password input and decryption entirely
		return { data: { note, message: 'Note found - the client will handle decryption' } };
	},

	async POST(ctx: Context<unknown>) {
		// For backward compatibility, POST requests should also render the client-side component
		// All password validation and decryption now happens client-side
		const { id } = ctx.params;
		if (!id) {
			throw new HttpError(404);
		}
		const db = await getNoteDatabase();
		const note = await db.getNoteById(id);

		if (!note) {
			throw new HttpError(404);
		}

		// Always render the client-side component - password validation is now client-side
		return { data: { note, message: 'Note found - the client will handle decryption' } };
	},
};

export default function NotePage({ data }: { data: NotePageProps }) {
	const { note, message } = data;
	// Always render the client-side component for zero-knowledge architecture
	return (
		<>
			<Header title='Opening Note' description={message} />
			<ViewEncryptedNote noteId={note.id} manualDeletion={note.manualDeletion} />
		</>
	);
}
