import { Handlers, PageProps } from '$fresh/server.ts';
import { noteDatabase } from '../database/db.ts';
import { Note } from '../types/types.ts';
import { compareHash, generateSHA256Hash } from '../utils/hashing.ts';
import PasswordInput from '../islands/PasswordInput.tsx';
import { decryptNoteContent } from '../utils/encryption.ts';
import Header from '../components/Header.tsx';
import PenIcon from '../components/PenIcon.tsx';
import { Button } from '../components/Button.tsx';
import HomeButton from '../components/HomeButton.tsx';
import Message from '../components/Message.tsx';

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

async function encryptNoteAndDestroy(note: Note, encryptionKey: string, confirm: boolean): Promise<Note> {
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

export const handler: Handlers<NotePageProps> = {
	async GET(_req, ctx) {
		const { id } = ctx.params;
		if (!id) {
			return ctx.renderNotFound();
		}

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

		if (passwordProtected && note.password && passwordHash && !await compareHash(passwordHash, note.password)) {
			// Password is required and does not match
			return ctx.render({
				note: note,
				passwordRequired: true,
				message: 'Incorrect password. Please try again.',
				confirmed: false,
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

			const encryptionKey = passwordProtected ? passwordHash : firstAuth;

			if (!encryptionKey) {
				return ctx.render({
					note: note,
					passwordRequired: true,
					message: 'No valid encryption key provided. Please enter a password or authentication token.',
					confirmed: false,
				});
			}

			const result = await encryptNoteAndDestroy(note, encryptionKey, confirm);

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
		return <NoteNotFoundPage message={message} />;
	}

	if (passwordRequired) {
		return <PasswordProtectedNote message={message} />;
	}

	if (confirmed) {
		return <ViewNoteConfirmed note={note} message={message} />;
	}

	return <ConfirmViewNote note={note} />;
}

function ConfirmViewNote({ note }: { note: Note }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<h1 class='text-4xl font-bold'>VailNote</h1>
			<p class='mt-2 text-lg text-gray-200'>
				Open-Source, Encrypted Note Sharing
			</p>
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'>
					<h2 class='text-3xl font-bold text-white mb-2 flex items-center gap-2'>
						<svg
							class='w-7 h-7 text-blue-400'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							viewBox='0 0 24 24'
						>
							<path strokeLinecap='round' strokeLinejoin='round' d='M12 20h9' />
							<path
								strokeLinecap='round'
								strokeLinejoin='round'
								d='M16.5 3.5a2.121 2.121 0 113 3L7 19.5H4v-3L16.5 3.5z'
							/>
						</svg>
						View & Destroy Note
					</h2>
					<p class='mt-1 text-gray-300 text-base'>
						This note will be <span class='text-red-400 font-semibold'>destroyed</span>{' '}
						after you view it. Are you sure you want to continue?
					</p>
					<form method='POST' class='mt-8 space-y-4'>
						<input type='hidden' name='id' value={note.id} />
						<input type='hidden' name='confirm' value='true' />
						<Button type='submit'>
							Destroy & View Note
						</Button>
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
			<h1 class='text-4xl font-bold'>VailNote</h1>
			<p class='mt-2 text-lg text-gray-200'>
				Open-Source, Encrypted Note Sharing
			</p>
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'>
					<h2 class='text-3xl font-bold text-white mb-2 flex items-center gap-2'>
						<PenIcon />
						Note Details
					</h2>
					<Message message={message} type={note.id ? 'success' : 'error'} />

					<h2 class='text-xl font-semibold text-white mt-2'>
						Content
					</h2>
					<div class='bg-gray-900 rounded p-4 shadow-inner'>
						<p class='mb-2 whitespace-pre-wrap break-words text-white'>
							{note.content}
						</p>
					</div>
					<HomeButton />
				</div>
			</div>
		</div>
	);
}

function PasswordProtectedNote({ message }: { message?: string }) {
	return (
		<>
			<Header title={`Password Protected`} />
			<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
				<h1 class='text-4xl font-bold'>VailNote</h1>
				<p class='mt-2 text-lg text-gray-200'>
					Open-Source, Encrypted Note Sharing
				</p>
				<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
					<div class='mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'>
						<h2 class='text-3xl font-bold text-white mb-2 flex items-center gap-2'>
							<svg
								class='w-7 h-7 text-blue-400'
								fill='none'
								stroke='currentColor'
								strokeWidth='2'
								viewBox='0 0 24 24'
							>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M12 20h9'
								/>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									d='M16.5 3.5a2.121 2.121 0 113 3L7 19.5H4v-3L16.5 3.5z'
								/>
							</svg>
							Enter Password
						</h2>
						<Message message={message} type='info' />
						<p class='mt-2 text-gray-400'>
							To view and destroy this note, please enter the correct password. A failed attempt will not destroy the note.
						</p>
						<form method='POST' class='mt-8 space-y-5' autoComplete='off'>
							<input type='hidden' name='confirm' value='true' />
							<div>
								<label
									class='block text-white text-lg font-semibold mb-2'
									htmlFor='password'
								>
									Password
								</label>
								<PasswordInput
									type='password'
									name='password'
									id='password'
									placeholder='Enter password to view note'
									required
								/>
							</div>
							<button
								type='submit'
								class='w-full mt-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl font-semibold text-lg shadow-lg hover:from-blue-600 hover:to-blue-800 transition'
							>
								View and Destroy Note
							</button>
						</form>
					</div>
				</div>
			</div>
		</>
	);
}

function NoteNotFoundPage({ message }: { message?: string }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<h1 class='text-4xl font-bold'>VailNote</h1>
			<p class='mt-2 text-lg text-gray-200'>
				Open-Source, Encrypted Note Sharing
			</p>
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col mt-6 p-8 rounded-2xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600'>
					<h2 class='text-3xl font-bold text-white mb-2'>Note Not Found</h2>
					<p class='text-gray-300'>
						{message || 'The note you are looking for does not exist.'}
					</p>
					<HomeButton />
				</div>
			</div>
		</div>
	);
}
