import { Context, PageProps } from 'fresh';
import { Note } from '../types/types.ts';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import SiteHeader from '../components/SiteHeader.tsx';
import ViewEncryptedNote from '../islands/ViewNote.tsx';
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from '../components/Card.tsx';
import { HttpError } from 'fresh';
import { VailnoteContext } from '../middleware.ts';

interface NotePageProps {
	note?: Note;
	message?: string;
}

export const handler = {
	async GET(ctx: Context<VailnoteContext>) {
		const { id } = ctx.params;
		if (!id) {
			throw new HttpError(404);
		}

		const noteDatabase = ctx.state.getNoteDatabase();
		const note = await noteDatabase.getNoteById(id);

		if (!note) {
			throw new HttpError(404);
		}

		// Always render the client-side component for zero-knowledge architecture
		// The client will handle password input and decryption entirely
		return {
			note,
			message: 'Note found - the client will handle decryption',
		};
	},

	async POST(ctx: Context<VailnoteContext>) {
		// For backward compatibility, POST requests should also render the client-side component
		// All password validation and decryption now happens client-side
		const { id } = ctx.params;
		if (!id) {
			throw new HttpError(404);
		}
		const noteDatabase = ctx.state.getNoteDatabase();
		const note = await noteDatabase.getNoteById(id);

		if (!note) {
			throw new HttpError(404);
		}

		// Always render the client-side component - password validation is now client-side
		return {
			note,
			message: 'Note found - decryption will happen in your browser',
		};
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
						<p class='text-gray-300 '>
							{message || 'The note you are looking for does not exist.'}
						</p>
					</CardContent>
					<CardFooter>
						<HomeButton />
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}
