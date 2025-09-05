import NoteService from '../lib/services/note-service.ts';
import ViewEncryptedNote from './ViewNote.tsx';

export default function Vault({ noteId }: { noteId?: string }) {
	if (!noteId) {
		return <div class='p-4 text-red-600'>Error: No note ID provided in the URL.</div>;
	}

	NoteService.useLocalVault(true);
	return <ViewEncryptedNote noteId={noteId} manualDeletion={false} />;
}
