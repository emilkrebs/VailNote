import { Button } from '../components/Button.tsx';
import { encryptNoteContent } from '../utils/encryption.ts';
import { useState } from 'preact/hooks';
import CopyContent from './CopyContent.tsx';
import PasswordInput from './PasswordInput.tsx';
import PenIcon from '../components/PenIcon.tsx';
import { generateRandomId } from '../types/types.ts';
import { generateSHA256Hash } from '../utils/hashing.ts';

interface CreateNoteData {
	message: string;
	noteId?: string;
	noteLink?: string;
}

interface CreateNoteFormProps {
	onCreate: (noteId: string, message: string, noteLink: string) => void;
	onError: (error: string) => void;
}

export default function CreateNote({ data }: { data: CreateNoteData }) {
	const [formData, setFormData] = useState<CreateNoteData>({ ...data });

	return (
		<div class='mt-6 p-4 md:p-8 rounded-xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 hover:shadow-2xl hover:shadow-blue-500/25 transition-shadow'>
			<h2 class='text-3xl font-bold text-white mb-2 flex items-center gap-2'>
				<PenIcon />
				Create a Note
			</h2>

			<p class='mt-1 text-gray-300 text-base'>
				Share your notes securely with a password. Notes are <span class='font-semibold text-blue-300'>encrypted</span>
				{' '}
				and <span class='font-semibold text-blue-300'>self-destruct</span> after a set time or after being viewed.
			</p>

			{formData.message && (
				<div
					class={`mt-6 p-4 rounded-lg border transition-all ${
						formData.noteId
							? 'bg-green-600/20 border-green-400 text-green-200'
							: 'bg-red-600/20 border-red-400 text-red-200'
					}`}
				>
					<span class='font-medium' title={formData.noteId ? 'Note ID: ' + formData.noteId : undefined}>
						{formData.message}
					</span>

					{formData.noteId && (
						<CopyContent
							content={formData.noteLink!}
							label={formData.noteLink!}
						/>
					)}
				</div>
			)}

			<div class='mt-8'>
				<CreateNoteForm
					onCreate={(id, message, noteLink) => {
						setFormData({ message, noteId: id, noteLink });
					}}
					onError={(error) => {
						setFormData({ message: error, noteId: undefined, noteLink: '' });
					}}
				/>
			</div>
		</div>
	);
}

function CreateNoteForm({ onCreate, onError }: CreateNoteFormProps) {
	async function handleSubmit(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		const noteContent = formData.get('noteContent')?.toString() || '';
		const notePassword = formData.get('notePassword')?.toString() || ''; // the plain password is never submitted to the server
		const expiresIn = formData.get('expiresIn')?.toString() || '';
		const firstAuth = generateRandomId(8);
		const passwordSHA256 = await generateSHA256Hash(notePassword);

		try {
			// encrypt the note content using the provided plain password or a random auth token
			const encryptedContent = await encryptNoteContent(
				noteContent,
				notePassword ? notePassword : firstAuth,
			);

			const requestBody = {
				content: encryptedContent.encrypted,
				password: notePassword ? passwordSHA256 : null, // Password should be hashed with SHA-256 before sending and is not used for encryption
				expiresAt: expiresIn,
				iv: encryptedContent.iv,
			};

			const response = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(requestBody),
			});

			const result = await response.json();
			if (response.ok) {
				const link = notePassword ? result.noteLink : `${result.noteLink}?auth=${firstAuth}`;
				onCreate(result.noteId, result.message, link);
				form.reset();
			} else {
				onError(result.error || 'Failed to create note.');
			}
		} catch (_err) {
			onError('An error occurred while creating the note.');
		}
	}

	return (
		<form class='mt-4 space-y-5' method='post' onSubmit={handleSubmit} autoComplete='off'>
			<div>
				<label
					class='block text-white text-lg font-semibold mb-2'
					htmlFor='noteContent'
				>
					Note
				</label>
				<textarea
					class='w-full h-52 p-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-400 transition'
					placeholder='Type your note here...'
					name='noteContent'
					id='noteContent'
					required
				>
				</textarea>
			</div>

			<div>
				<label
					class='block text-white text-lg font-semibold mb-2'
					htmlFor='notePassword'
					title='Set a password to protect and encrypt your note'
				>
					Password <span class='text-gray-400 font-normal text-base'>(optional)</span>
				</label>
				<PasswordInput
					type='password'
					name='notePassword'
					id='notePassword'
					placeholder='Enter to set a password'
				/>
			</div>

			<div>
				<label
					class='block text-white text-lg font-semibold'
					htmlFor='expiresIn'
				>
					Expire After
					<span class='text-gray-400 font-normal text-sm'>
						- Note will self-destruct after this time
					</span>
				</label>
				<select
					name='expiresIn'
					id='expiresIn'
					class='w-full p-3 border border-gray-600 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-400 transition'
					defaultValue='24h'
				>
					<option value='10m'>10 minutes</option>
					<option value='1h'>1 hour</option>
					<option value='6h'>6 hours</option>
					<option value='12h'>12 hours</option>
					<option value='24h' selected>24 hours</option>
					<option value='3d'>3 days</option>
					<option value='7d'>7 days</option>
					<option value='30d'>30 days</option>
				</select>
			</div>

			<Button type='submit'>
				Save Note
			</Button>

			<noscript class='mt-1 text-red-500 text-base'>
				<p>
					⚠ You have JavaScript disabled. Notes will now be encrypted on the server side. Enable JavaScript for
					client-side encryption.
					<a href='/privacy#javascript-usage' class='underline mx-1'>Learn more</a>
				</p>
			</noscript>

			<div class='mt-4 text-sm text-gray-400'>
				<p>
					Notes are encrypted with AES-GCM and can be protected with a password. They will self-destruct after the
					specified time or after being viewed.
					<a href='/privacy#javascript-usage' class='underline mx-2'>Learn more</a>
				</p>
			</div>
		</form>
	);
}
