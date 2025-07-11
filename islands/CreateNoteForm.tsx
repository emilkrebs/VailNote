import { Button } from '../components/Button.tsx';
import { useState } from 'preact/hooks';
import CopyContent from './CopyContent.tsx';
import PasswordInput from './PasswordInput.tsx';
import PenIcon from '../components/PenIcon.tsx';
import Select from '../components/Select.tsx';
import NoteAPIService from '../utils/note-api-service.ts';

// Constants
const MESSAGES = {
	CREATE_SUCCESS: 'Note created successfully!',
	CREATE_ERROR: 'Failed to create note.',
	UNEXPECTED_ERROR: 'An error occurred while creating the note.',
} as const;

const EXPIRY_OPTIONS = [
	{ value: '10m', label: '10 minutes' },
	{ value: '1h', label: '1 hour' },
	{ value: '6h', label: '6 hours' },
	{ value: '12h', label: '12 hours' },
	{ value: '24h', label: '24 hours', default: true },
	{ value: '3d', label: '3 days' },
	{ value: '7d', label: '7 days' },
	{ value: '30d', label: '30 days' },
];

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
		<div class='mt-6 p-4 sm:p-8 rounded-xl shadow-xl w-full bg-gradient-to-br from-gray-800 to-gray-700 border border-gray-600 hover:shadow-2xl hover:shadow-blue-500/25 transition-shadow'>
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
					<span class='font-medium text-wrap' title={formData.noteId ? 'Note ID: ' + formData.noteId : undefined}>
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
	const handleSubmit = async (event: Event) => {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const noteContent = formData.get('noteContent')?.toString() || '';
		const notePassword = formData.get('notePassword')?.toString() || undefined; // the plain password is never submitted to the server
		const expiresIn = formData.get('expiresIn')?.toString() || '';
		const manualDeletion = formData.get('manualDeletion') === 'enabled';

		try {
			const result = await NoteAPIService.createNote({
				noteContent,
				notePassword,
				expiresIn,
				manualDeletion,
			});

			if (!result.success) {
				throw new Error(result.message || MESSAGES.CREATE_ERROR);
			}
			const link = notePassword ? result.noteId : `${result.noteId}#auth=${result.authKey}`;
			onCreate(result.noteId!, MESSAGES.CREATE_SUCCESS, `${globalThis.location.origin}/${link}`);
			form.reset();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : MESSAGES.UNEXPECTED_ERROR;
			onError(errorMessage);
		}
	};

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
				<Select
					name='expiresIn'
					id='expiresIn'
					defaultValue='24h'
				>
					{EXPIRY_OPTIONS.map((option) => (
						<option
							key={option.value}
							value={option.value}
							selected={option.default}
						>
							{option.label}
						</option>
					))}
				</Select>
			</div>

			{/* Advanced Options Container */}
			<details class='mt-4 bg-gray-800/50 rounded-xl p-4'>
				<summary class='text-white text-lg font-semibold cursor-pointer'>
					Advanced Options
				</summary>
				<div class='mt-2 space-y-2'>
					<div>
						<label class='block text-white text-lg font-semibold' htmlFor='replaceContent'>
							Manual Deletion
						</label>
						<p class='text-gray-400 text-sm mb-2'>
							Let anybody with access to the note delete it manually at any time. This will turn off self-destruction
							after viewing - use with caution.
						</p>
						<Select
							name='manualDeletion'
							id='manualDeletion'
							defaultValue='disabled'
						>
							<option value='enabled'>Enable Manual Deletion</option>
							<option value='disabled' selected>Disable Manual Deletion</option>
						</Select>
					</div>
				</div>
			</details>

			<Button type='submit' variant='primary' class='w-full flex items-center justify-center gap-2'>
				Save Note
			</Button>

			<noscript class='mt-1 text-red-500 text-base'>
				<p>
					⚠ You have JavaScript disabled. Notes will now be encrypted on the server side. Enable JavaScript for
					client-side encryption. Zero-knowledge encryption is not possible without JavaScript.{' '}
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
