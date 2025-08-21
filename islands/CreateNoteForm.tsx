import { Button } from '../components/Button.tsx';
import { useState } from 'preact/hooks';
import CopyContent from './CopyContent.tsx';
import PasswordInput from './PasswordInput.tsx';
import PenIcon from '../components/PenIcon.tsx';
import Select from '../components/Select.tsx';
import NoteAPIService from '../utils/note-api-service.ts';
import Message from '../components/Message.tsx';

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

const MANUAL_DELETION_OPTIONS = [
	{ value: 'disabled', label: 'Disable Manual Deletion', default: true },
	{ value: 'enabled', label: 'Enable Manual Deletion' },
];

// Types
interface CreateNoteData {
	message?: string;
	noteId?: string;
	noteLink?: string;
}

interface CreateNoteFormProps {
	onCreate: (noteId: string, message: string, noteLink: string) => void;
	onError: (error: string) => void;
}

function MessageDisplay({ data }: { data: CreateNoteData }) {
	const isSuccess = !!data.noteId;
	return (
		<Message
			variant={isSuccess ? 'success' : 'error'}
			visible={!!data.message}
			class='mt-6 p-6 w-full'
		>
			<div class='flex items-start gap-3'>
				<div
					class={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${isSuccess ? 'bg-green-500' : 'bg-red-500'
						}`}
				>
					{isSuccess ? '✓' : '✕'}
				</div>
				<div class='flex-1'>
					<p class={`font-semibold text-lg ${isSuccess ? 'text-green-200' : 'text-red-200'}`}>
						{data.message}
					</p>
					{data.noteId && (
						<p class='text-green-300/80 text-sm mt-1' title={`Note ID: ${data.noteId}`}>
							Share the link below to give someone access to your note
						</p>
					)}
				</div>
			</div>

			{data.noteId && data.noteLink && (
				<div class='mt-4 pt-4 border-t border-green-400/20 w-72 sm:w-max'>
					<CopyContent
						content={data.noteLink}
						label={data.noteLink}
					/>
				</div>
			)}
		</Message>
	);
}

function CreateNoteHeader() {
	return (
		<div class='text-start mb-8'>
			<div class='flex items-center justify-start gap-3 mb-4'>
				<div class='p-3 bg-blue-600/20 rounded-xl'>
					<PenIcon />
				</div>
				<h2 class='text-4xl font-bold text-white'>
					Create a Note
				</h2>
			</div>
			<p class='text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed'>
				Share your notes securely with a password. Notes are{' '}
				<span class='font-semibold text-blue-300 bg-blue-500/10 px-2 py-1 rounded'>encrypted</span> and{' '}
				<span class='font-semibold text-blue-300 bg-blue-500/10 px-2 py-1 rounded'>self-destruct</span>{' '}
				after a set time or after being viewed.
			</p>
		</div>
	);
}

export default function CreateNote({ message }: { message?: string }) {
	const [formData, setFormData] = useState<CreateNoteData>({ message });

	return (
		<div class='max-w-4xl mx-auto'>
			<div class='bg-gradient-to-br from-gray-800/95 to-gray-700/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-600/50'>
				<div class='p-4 sm:p-12'>
					<CreateNoteHeader />

					<MessageDisplay data={formData} />

					<div class='mt-8 w-full'>
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
		const notePassword = formData.get('notePassword')?.toString() || undefined;
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

			globalThis.scrollTo({ top: 64, behavior: 'smooth' });
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : MESSAGES.UNEXPECTED_ERROR;
			onError(errorMessage);
		}
	};

	return (
		<form class='space-y-8' method='post' onSubmit={handleSubmit} autoComplete='off'>
			<div class='grid gap-8'>
				{/* Note Content Field */}
				<div>
					<label
						class='block text-white text-lg font-semibold mb-2'
						htmlFor='noteContent'
					>
						Note Content <span class='text-red-400 ml-1'>*</span>
					</label>
					<textarea
						class='w-full h-52 p-2 border border-gray-600 rounded-xl bg-gray-900 text-white focus:ring-2 focus:ring-blue-400 transition'
						placeholder='Type your note here...'
						name='noteContent'
						id='noteContent'
						required
					>
					</textarea>
				</div>

				{/* Password Field */}
				<div>
					<label
						class='block text-white text-lg font-semibold mb-2'
						htmlFor='notePassword'
						title='Set a password to protect and encrypt your note'
					>
						Password <span class='text-gray-400 font-normal text-base'>(optional)</span>
					</label>
					<p class='text-gray-400 text-sm -mt-1'>
						Optional: Add password protection for enhanced security
					</p>
					<PasswordInput
						type='password'
						name='notePassword'
						id='notePassword'
						placeholder='Enter to set a password'
					/>
				</div>

				{/* Expiration Field */}
				<div>
					<label
						class='block text-white text-lg font-semibold mb-2'
						htmlFor='expiresIn'
					>
						Expire After
					</label>
					<p class='text-gray-400 text-sm -mt-1'>
						Note will automatically self-destruct after this time period
					</p>
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

				{/* Advanced Options */}
				<details class='group bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-200'>
					<summary class='text-white text-lg font-semibold cursor-pointer flex items-center gap-2 hover:text-blue-300 transition-colors'>
						<span class='transform group-open:rotate-90 transition-transform duration-200'>
							<svg
								xmlns='http://www.w3.org/2000/svg'
								class='h-5 w-5'
								fill='none'
								viewBox='0 0 24 24'
								stroke='currentColor'
							>
								<path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
							</svg>
						</span>
						Advanced Options
					</summary>
					<div class='mt-6 pt-4 border-t border-gray-600/30'>
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
							{MANUAL_DELETION_OPTIONS.map((option) => (
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
				</details>
			</div>

			{/* Submit Button */}

			<Button type='submit' variant='primary' class='w-full flex items-center justify-center gap-2'>
				Save Note
			</Button>

			{/* Warnings and Info */}
			<noscript>
				<Message variant='error' class='mt-2'>
					<div class='flex items-start gap-3'>
						<span class='text-red-400 text-xl'>⚠</span>
						<div class='text-red-200'>
							<p class='font-semibold mb-1'>JavaScript Required</p>
							<p class='text-sm'>
								You have JavaScript disabled. Enable JavaScript for client-side encryption. Zero-knowledge encryption is
								not possible without JavaScript.
							</p>
							<a
								href='/privacy#javascript-usage'
								class='inline-block mt-2 text-red-300 hover:text-red-200 underline'
							>
								Learn more about JavaScript usage
							</a>
						</div>
					</div>
				</Message>
			</noscript>

			<Message variant='info' class='mt-6'>
				<div class='flex items-start gap-3'>
					<div class='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold'>
						i
					</div>
					<div class='text-sm text-blue-200 leading-relaxed'>
						<p class='font-semibold mb-2'>Security Information:</p>
						<ul class='space-y-1 text-blue-300/90'>
							<li>• Notes are encrypted with AES-GCM encryption</li>
							<li>• Password protection adds an additional security layer</li>
							<li>• Notes automatically self-destruct after viewing or expiration</li>
							<li>• All encryption happens in your browser - we never see your data</li>
						</ul>
						<a
							href='/privacy#javascript-usage'
							class='inline-block mt-3 text-blue-400 hover:text-blue-300 underline transition-colors'
						>
							Learn more about our security →
						</a>
					</div>
				</div>
			</Message>
		</form>
	);
}
