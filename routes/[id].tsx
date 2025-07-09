import { Handlers, PageProps } from '$fresh/server.ts';
import { Note } from '../types/types.ts';
import { compareHash, generateSHA256Hash } from '../utils/hashing.ts';
import PasswordInput from '../islands/PasswordInput.tsx';
import { decryptNoteContent } from '../utils/encryption.ts';
import Header from '../components/Header.tsx';
import PenIcon from '../components/PenIcon.tsx';
import HomeButton from '../components/HomeButton.tsx';
import Message from '../components/Message.tsx';
import { generateRateLimitHeaders } from '../utils/rate-limiting/rate-limit-headers.ts';
import { State } from './_middleware.ts';
import { NoteDatabase } from '../database/note-database.ts';
import SiteHeader from '../components/SiteHeader.tsx';
import { Button } from '../components/Button.tsx';

interface NotePageProps {
	note?: Note;
	passwordRequired?: boolean;
	confirmed: boolean;

	message?: string;
}

async function getPasswordHash(password: string): Promise<string> {
	if (!password || password.trim() === '') {
		throw new Error('Password is required to encrypt the note.');
	}
	const sha256Hash = await generateSHA256Hash(password);

	return sha256Hash;
}

async function decryptNoteAndDestroy(
	noteDatabase: NoteDatabase,
	note: Note,
	encryptionKey: string,
	confirm: boolean,
): Promise<Note> {
	if (!confirm) {
		throw new Error('Please confirm you want to view and destroy this note.');
	}

	if (!encryptionKey) {
		throw new Error('No valid encryption key provided. Please enter a password or authentication token.');
	}

	const decryptedContent = await decryptNoteContent(note.content, note.iv, encryptionKey);
	await noteDatabase.deleteNote(note.id);

	return {
		...note,
		content: decryptedContent,
	};
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

		if (note.password) {
			return ctx.render({
				note,
				passwordRequired: true,
				confirmed: false,
				message: 'This note is private and requires a password to view.',
			});
		}

		return ctx.render({
			note,
			passwordRequired: false,
			confirmed: false,
			message: 'This note is public and does not require a password to view.',
		});
	},

	async POST(req, ctx) {
		const rateLimitResult = await ctx.state.context.getRateLimiter().checkRateLimit(req);
		const noteDatabase = ctx.state.context.getNoteDatabase();

		if (!rateLimitResult.allowed) {
			return ctx.render({
				message: 'Rate limit exceeded. Please try again later.',
				note: undefined,
				passwordRequired: false,
				confirmed: false,
			}, {
				headers: generateRateLimitHeaders(rateLimitResult),
			});
		}
		const { id } = ctx.params;
		const formData = await req.formData();
		const password = formData.get('password') as string;
		const confirm = formData.get('confirm') === 'true';

		const passwordHash = password ? await getPasswordHash(password) : undefined;

		const passwordProtected = password && password.trim() !== '';

		const note = await noteDatabase.getNoteById(id);

		if (!note) {
			return ctx.renderNotFound();
		}

		// Always perform hash comparison even if note has no password to prevent timing attacks
		const isPasswordValid = note.password && passwordHash
			? await compareHash(passwordHash, note.password)
			: !note.password && !passwordProtected;

		if (note.password && (!passwordProtected || !isPasswordValid)) {
			// Password is required and does not match
			return ctx.render({
				note: note,
				passwordRequired: true,
				message: 'Incorrect password. Please try again.',
				confirmed: false,
			}, {
				headers: generateRateLimitHeaders(rateLimitResult),
			});
		}

		if (!confirm) {
			return ctx.render({
				note: note,
				passwordRequired: true,
				message: 'Please confirm you want to view and destroy this note.',
				confirmed: false,
			});
		}

		try {
			const url = new URL(req.url);
			const firstAuthParameter = url.searchParams.get('auth'); // may not exist if note was created without javascript
			const firstAuth = firstAuthParameter ? firstAuthParameter : id;

			// use the plain password if provided, otherwise use the firstAuth token
			const encryptionKey = passwordProtected ? password : firstAuth;

			if (!encryptionKey) {
				return ctx.render({
					note: note,
					passwordRequired: true,
					message: 'No valid encryption key provided. Please enter a password or authentication token.',
					confirmed: false,
				});
			}

			const result = await decryptNoteAndDestroy(noteDatabase, note, encryptionKey, confirm);

			return ctx.render({
				note: result,
				passwordRequired: false,
				message: 'This note has been destroyed. It will not be retrievable again.',
				confirmed: true,
			});
		} catch (_err) {
			return ctx.render({
				passwordRequired: false,
				confirmed: false,
				message: 'Failed to decrypt note content. It may have been tampered with or is invalid.',
			});
		}
	},
};

export default function NotePage(ctx: PageProps<NotePageProps>) {
	const { note, passwordRequired, message, confirmed } = ctx.data;

	if (!note) {
		return <NoteErrorPage message={message} />;
	}

	if (passwordRequired) {
		return <PasswordProtectedNote />;
	}

	if (confirmed) {
		return <ViewNoteConfirmed note={note} message={message} />;
	}

	return <ConfirmViewNote note={note} />;
}

function ConfirmViewNote({ note }: { note: Note }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='mt-6 p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
					{/* Header */}
					<div class='mb-8'>
						<h2 class='text-3xl font-bold text-white mb-3'>Confirm View & Destroy</h2>
						<p class='text-gray-300 text-base leading-relaxed'>
							This action is{' '}
							<span class='text-red-400 font-semibold'>irreversible</span>. The note will be permanently destroyed after
							viewing.
						</p>
					</div>

					<WarningMessage />

					<form method='POST' class='space-y-6'>
						<input type='hidden' name='id' value={note.id} />
						<input type='hidden' name='confirm' value='true' />

						<div class='flex flex-row w-full justify-between gap-4'>
							<HomeButton class='min-w-max' />
							<Button color='danger' class='w-full' type='submit'>
								View and Destroy Note
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

function ViewNoteConfirmed(
	{ note, message }: { note: Note; message?: string },
) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='mt-6 p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
					{/* Header with icon and title */}
					<div class='flex items-center justify-start gap-2 mb-6 pb-4 border-b border-gray-600/50'>
						<div class='p-3 bg-gray-800 rounded-xl'>
							<PenIcon />
						</div>
						<div>
							<h2 class='text-3xl font-bold text-white'>Note Retrieved</h2>
							<p class='text-green-300 text-sm font-medium'>Successfully decrypted and displayed</p>
						</div>
					</div>

					<Message message={message} type={note.id ? 'success' : 'error'} />

					{/* Content section with enhanced styling */}
					<div class='mt-6'>
						<div class='flex items-center gap-2 mb-4'>
							<svg class='w-5 h-5 text-gray-300' fill='currentColor' viewBox='0 0 20 20'>
								<path
									fill-rule='evenodd'
									d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
									clip-rule='evenodd'
								>
								</path>
							</svg>
							<h3 class='text-xl font-semibold text-white'>Content</h3>
						</div>

						<div class='relative bg-gray-900/80 rounded-lg p-6 shadow-inner border border-gray-700/50'>
							<div class='pr-12'>
								<p class='whitespace-pre-wrap break-words text-gray-100 leading-relaxed text-base'>
									{note.content}
								</p>
							</div>
						</div>
					</div>

					<div class='mt-8 pt-6 border-t border-gray-600/50'>
						<HomeButton class='w-full' />
					</div>
				</div>
			</div>
		</div>
	);
}

function PasswordProtectedNote() {
	return (
		<>
			<Header title={`Password Protected`} />
			<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
				<SiteHeader />
				<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
					<div class='mt-6 p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
						<div class='mb-8'>
							<h2 class='text-3xl font-bold text-white mb-3 flex items-center gap-2'>
								<PenIcon />
								Enter Password
							</h2>

							<p class='text-gray-300 mb-6'>
								This note is private and requires a password to view. Please enter the password below to decrypt and
								view the note.
							</p>
						</div>

						<WarningMessage />

						{/* Password input form */}
						<form method='POST' class='space-y-6' autoComplete='off'>
							<input type='hidden' name='confirm' value='true' />
							<div>
								<label
									class='block text-white text-lg font-semibold mb-3'
									htmlFor='password'
								>
									Enter Password
								</label>
								<PasswordInput
									type='password'
									name='password'
									id='password'
									placeholder='Enter password to decrypt note'
									required
								/>
							</div>
							<Button
								color='primary'
								type='submit'
								class='w-full'
							>
								View and Destroy Note
							</Button>
						</form>
					</div>
				</div>
			</div>
		</>
	);
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

function WarningMessage() {
	return (
		<div class='bg-red-900/20 border border-red-700/30 rounded-xl p-6 mb-8'>
			<div class='flex items-start gap-4'>
				<svg class='w-6 h-6 text-red-400 mt-1 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
					<path
						fill-rule='evenodd'
						d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
						clip-rule='evenodd'
					>
					</path>
				</svg>
				<div>
					<h3 class='text-red-300 font-semibold text-lg mb-2'>What happens next:</h3>
					<ul class='text-red-200 text-sm space-y-2'>
						<li class='flex items-center gap-2'>
							<span class='w-1.5 h-1.5 bg-red-400 rounded-full'></span>
							Note content will be decrypted and displayed
						</li>
						<li class='flex items-center gap-2'>
							<span class='w-1.5 h-1.5 bg-red-400 rounded-full'></span>
							Note will be immediately deleted from our servers
						</li>
						<li class='flex items-center gap-2'>
							<span class='w-1.5 h-1.5 bg-red-400 rounded-full'></span>
							This action cannot be undone
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
