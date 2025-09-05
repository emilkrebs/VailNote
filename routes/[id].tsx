import { Handlers, PageProps } from '$fresh/server.ts';
import { Note } from '../types/types.ts';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import { State } from './_middleware.ts';
import SiteHeader from '../components/SiteHeader.tsx';
import ViewEncryptedNote from '../islands/ViewNote.tsx';
import Card, { CardContent, CardHeader, CardTitle } from '../components/Card.tsx';

interface NotePageProps {
	note?: Note;
	message?: string;
}

export const handler: Handlers<NotePageProps, State> = {
	async GET(_req, ctx) {
		const { id, mode } = ctx.params;
		if (!id) {
			return ctx.renderNotFound();
		}
		if (mode === 'vault') {
			return ctx.render({
				message: 'Local Vault mode - note will be handled locally',
			});
		}
		const noteDatabase = ctx.state.context.getNoteDatabase();
		const note = await noteDatabase.getNoteById(id);

		if (!note) {
			return ctx.renderNotFound();
		}

		// Always render the client-side component for zero-knowledge architecture
		// The client will handle password input and decryption entirely
		return ctx.render({
			note,
			message: 'Note found - the client will handle decryption',
		});
	},

	async POST(_req, ctx) {
		// For backward compatibility, POST requests should also render the client-side component
		// All password validation and decryption now happens client-side
		const { id } = ctx.params;
		if (!id) {
			return ctx.renderNotFound();
		}
		const noteDatabase = ctx.state.context.getNoteDatabase();
		const note = await noteDatabase.getNoteById(id);

		if (!note) {
			return ctx.renderNotFound();
		}

		// Always render the client-side component - password validation is now client-side
		return ctx.render({
			note,
			message: 'Note found - decryption will happen in your browser',
		});
	},
};

export default function NotePage(ctx: PageProps<NotePageProps>) {
	const { note, message } = ctx.data;

	if (!note) {
		return <NoteErrorPage message={message} />;
	}

	// Always render the client-side component for zero-knowledge architecture
	return (
		<>
			<Header title='Opening Note' description={message} />
			<ViewEncryptedNote noteId={note.id} manualDeletion={note.manualDeletion} />
		</>
	);
}

export function NoteErrorPage({ message }: { message?: string }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<Header title='Note Not Found' />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<Card>
					<CardHeader>
						<CardTitle>Note Not Found</CardTitle>
					</CardHeader>
					<CardContent>
						<p class='text-gray-300'>
							{message || 'The note you are looking for does not exist.'}
						</p>
					</CardContent>
					<HomeButton />
				</Card>
			</div>
		</div>
	);
}
