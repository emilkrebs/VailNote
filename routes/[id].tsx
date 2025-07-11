import { Handlers, PageProps } from '$fresh/server.ts';
import { Note } from '../types/types.ts';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import { State } from './_middleware.ts';
import SiteHeader from '../components/SiteHeader.tsx';
import ViewEncryptedNote from '../islands/ViewNote.tsx';

interface NotePageProps {
	note?: Note;
	passwordRequired?: boolean;
	confirmed: boolean;

	message?: string;
}


export const handler: Handlers<NotePageProps, State> = {
	async GET(_req, ctx) {
		const { id } = ctx.params;
		if (!id) {
			return ctx.renderNotFound();
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
			passwordRequired: false,
			confirmed: true, // Always confirmed since client handles everything
			message: 'Note found - decryption will happen in your browser',
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
			passwordRequired: false,
			confirmed: true,
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
	return <ViewEncryptedNote noteId={note.id} message={message} />;
}

function NoteErrorPage({ message }: { message?: string }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<Header title='Note Not Found' />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'>
					<h2 class='text-3xl font-bold text-white mb-2'>Error</h2>
					<p class='text-gray-300'>
						{message || 'The note you are looking for does not exist.'}
					</p>
					<HomeButton />
				</div>
			</div>
		</div>
	);
}
