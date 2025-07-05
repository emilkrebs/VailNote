import { Handlers, PageProps } from '$fresh/server.ts';
import Header from '../components/Header.tsx';
import { noteDatabase } from '../database/db.ts';
import CreateNote from '../islands/CreateNoteForm.tsx';
import { formatExpiration } from '../types/types.ts';
import { encryptNoteContent } from '../utils/encryption.ts';
import { generateHash, generateSHA256Hash } from '../utils/hashing.ts';

export const handler: Handlers = {
	GET(_req, ctx) {
		return ctx.render({ message: '' });
	},
	async POST(req, ctx) {
		// this endpoint is only used to create a note when the client does not have JavaScript enabled
		const form = await req.formData();
		const noteContent = form.get('noteContent') as string;
		const password = form.get('notePassword') as string;
		const expiresIn = form.get('expiresIn') as string;
		const passwordSHA256 = await generateSHA256Hash(password);

		if (!noteContent || noteContent.trim() === '') {
			return ctx.render({ message: 'Please enter a note.' });
		}

		const noteId = await noteDatabase.generateNoteId();

		const { encrypted: encryptedContent, iv } = await encryptNoteContent(
			noteContent,
			password ? passwordSHA256 : noteId,
		);

		const insertResult = await noteDatabase.insertNote({
			id: noteId,
			content: encryptedContent,
			expiresAt: formatExpiration(expiresIn),
			password: password ? await generateHash(passwordSHA256) : undefined,
			iv: iv,
		});

		if (!insertResult.success) {
			return ctx.render({
				message: `Failed to save note: ${insertResult.error}`,
				noteId: null,
				noteLink: '',
			});
		}

		return ctx.render({
			message: 'Note saved successfully!',
			noteId: noteId,
			noteLink: `${ctx.url}${noteId}`,
		});
	},
};

export default function Home({ data }: PageProps) {
	return (
		<>
			<Header title='Home' description='VailNote is a secure and open-source note-sharing application.' />
			<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-8 md:py-16'>
				<h1 class='text-4xl font-bold'>VailNote</h1>
				<p class='mt-2 text-lg text-gray-200'>
					Open-Source, Encrypted Note Sharing
				</p>

				<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-2 md:px-4 py-4 md:py-8'>
					<CreateNote data={data} />
				</div>
			</div>
		</>
	);
}
