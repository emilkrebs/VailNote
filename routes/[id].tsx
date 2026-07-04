import { Context } from 'fresh';
import { Note } from '../lib/types.ts';
import Header from '../components/Header.tsx';
import ViewEncryptedNote from '../islands/ViewNote.tsx';
import { HttpError } from 'fresh';
import { State } from '../lib/types/common.ts';
import { noteDatabase } from '../main.ts';

interface NotePageProps {
    note: Note;
    message?: string;
}

export const handler = {
    async GET(ctx: Context<State>) {
        const { id } = ctx.params;
        if (!id) {
            throw new HttpError(404);
        }

        const note = await noteDatabase.getNoteById(id);

        if (!note) {
            throw new HttpError(404);
        }

        // Always render the client-side component for zero-knowledge architecture
        // The client will handle password input and decryption entirely
        return { data: { note, message: 'Note found - the client will handle decryption' } };
    },
};

export default function NotePage({ data }: { data: NotePageProps }) {
    const { note, message } = data;
    return (
        <>
            <Header title='Opening Note' description={message} />
            <ViewEncryptedNote noteId={note.id} manualDeletion={note.manualDeletion} hasPassword={!!note.password} />
        </>
    );
}
