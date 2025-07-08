import { Handlers, PageProps } from '$fresh/server.ts';
import Header from '../components/Header.tsx';
import CreateNote from '../islands/CreateNoteForm.tsx';
import { formatExpiration } from '../types/types.ts';
import { encryptNoteContent } from '../utils/encryption.ts';
import { generateHash, generateSHA256Hash } from '../utils/hashing.ts';
import { generateRateLimitHeaders } from '../utils/rate-limiting/rate-limit-headers.ts';
import { State } from './_middleware.ts';


interface HomeData {
	message: string;
	noteId?: string | null;
	noteLink?: string;
}

export const handler: Handlers<HomeData, State> = {
	GET(_req, ctx) {
		return ctx.render({ message: '' });
	},
	async POST(req, ctx) {
		// this endpoint is only used to create a note when the client does not have JavaScript enabled
		const rateLimitResult = await ctx.state.context.getRateLimiter().checkRateLimit(req);
		const noteDatabase = ctx.state.context.getNoteDatabase();
		if (!rateLimitResult.allowed) {
			return ctx.render({
				message: 'Rate limit exceeded. Please try again later in a few minutes.',
				noteId: null,
				noteLink: '',
			}, {
				headers: generateRateLimitHeaders(rateLimitResult),
			});
		}

		const form = await req.formData();
		const noteContent = form.get('noteContent') as string;
		const password = form.get('notePassword') as string; // the plain password is never submitted to the server
		const expiresIn = form.get('expiresIn') as string;
		const passwordSHA256 = await generateSHA256Hash(password);

		if (!noteContent || noteContent.trim() === '') {
			return ctx.render({ message: 'Please enter a note.' });
		}

		const noteId = await noteDatabase.generateNoteId();

		// encrypt note content using the provided plain password or a random auth token
		const encryptedContent = await encryptNoteContent(
			noteContent,
			password ? password : noteId,
		);

		const insertResult = await noteDatabase.insertNote({
			id: noteId,
			content: encryptedContent.encrypted,
			expiresAt: formatExpiration(expiresIn),
			password: password ? await generateHash(passwordSHA256) : undefined, // Password should be hashed with SHA-256 before sending and is not used for encryption
			iv: encryptedContent.iv,
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
