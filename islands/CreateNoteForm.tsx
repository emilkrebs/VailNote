import { Button } from '../components/Button.tsx';
import { useState } from 'preact/hooks';
import PenIcon from '../components/PenIcon.tsx';
import Message from '../components/Message.tsx';
import NoteService from '../lib/services/note-service.ts';
import Card, { CardContent, CardHeader, CardTitle } from '../components/Card.tsx';
import { Collapsible, FormGroup, Label, Select, SelectOption, Textarea } from '../components/Form.tsx';
import * as v from '@valibot/valibot';
import {
	CreateNoteSchema,
	createNoteSchema,
	expirationOptions,
	MANUAL_DELETION_OPTIONS,
	manualDeletionOptions,
} from '../lib/validation/note.ts';
import PasswordToggle from '../components/PasswordToggle.tsx';

// Constants
const MESSAGES = {
	CREATE_SUCCESS: 'Note created successfully!',
	CREATE_ERROR: 'Failed to create note.',
	UNEXPECTED_ERROR: 'An error occurred while creating the note.',
} as const;

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
		>
			<div class='flex items-start gap-3'>
				<div
					class={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
						isSuccess ? 'bg-green-500' : 'bg-red-500'
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
				<div class='mt-4 pt-4 border-t border-green-400/20'>
					<div class='bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 overflow-hidden'>
						<div class='flex items-start gap-3 min-w-0'>
							<div class='flex-1 min-w-0'>
								<p class='text-xs font-medium text-green-300 mb-1'>Share Link</p>
								<div class='flex items-center gap-2 min-w-0'>
									<code
										class='flex-1 min-w-0 text-sm font-mono text-slate-200 bg-slate-900/50 px-2 py-1 rounded border border-slate-600/30 break-all overflow-hidden'
										title={data.noteLink}
									>
										{data.noteLink}
									</code>
									<button
										type='button'
										onClick={async () => {
											try {
												if (data.noteLink) {
													await navigator.clipboard.writeText(data.noteLink);
												}
											} catch (e) {
												console.error('Failed to copy:', e);
											}
										}}
										class='flex-shrink-0 p-2 cursor-pointer text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-all duration-200'
										title='Copy link to clipboard'
									>
										<svg
											xmlns='http://www.w3.org/2000/svg'
											width='16'
											height='16'
											viewBox='0 0 24 24'
											fill='none'
											stroke='currentColor'
											strokeWidth='2'
											strokeLinecap='round'
											strokeLinejoin='round'
										>
											<rect x='9' y='9' width='13' height='13' rx='2' />
											<path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}
		</Message>
	);
}

export default function CreateNote({ message }: { message?: string }) {
	const [formData, setFormData] = useState<CreateNoteData>({ message });

	return (
		<div class='max-w-4xl mx-auto'>
			<Card>
				<CardHeader>
					<CardTitle>
						<div class='flex items-center justify-start gap-3'>
							<div class='p-3 bg-blue-600/20 rounded-xl'>
								<PenIcon />
							</div>
							Create a Note
						</div>
					</CardTitle>
					<p class='text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed'>
						Share your notes securely with a password. Notes are{' '}
						<span class='font-semibold text-blue-300 bg-blue-500/10 px-2 py-1 rounded'>encrypted</span> and{' '}
						<span class='font-semibold text-blue-300 bg-blue-500/10 px-2 py-1 rounded text-nowrap'>self-destruct</span>
						{' '}
						after a set time or after being viewed.
					</p>
					<MessageDisplay data={formData} />
				</CardHeader>
				<CardContent>
					<CreateNoteForm
						onCreate={(id, message, noteLink) => {
							setFormData({ message, noteId: id, noteLink });
						}}
						onError={(error) => {
							setFormData({ message: error, noteId: undefined, noteLink: '' });
						}}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

function CreateNoteForm({ onCreate, onError }: CreateNoteFormProps) {
	const handleSubmit = async (event: Event) => {
		console.log('Submitting create note form');
		event.preventDefault();

		const form = event.target as HTMLFormElement;
		try {
			const data = Object.fromEntries(new FormData(form));
			const formData = v.parse(createNoteSchema, data) as CreateNoteSchema;

			const content = formData.content;
			const password = formData.password;
			const expiresIn = formData.expiresIn;
			const manualDeletion = formData.manualDeletion === MANUAL_DELETION_OPTIONS.enabled;

			const result = await NoteService.createNote({
				content,
				password,
				expiresIn,
				manualDeletion,
			});

			if (!result.success) {
				throw new Error(result.message || MESSAGES.CREATE_ERROR);
			}

			onCreate(result.noteId!, MESSAGES.CREATE_SUCCESS, `${globalThis.location.origin}/${result.link}`);
			form.reset();

			// Use requestAnimationFrame to prevent blocking the main thread
			requestAnimationFrame(() => {
				globalThis.scrollTo({ top: 64, behavior: 'smooth' });
			});
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : MESSAGES.UNEXPECTED_ERROR;
			onError(errorMessage);
		}
	};

	return (
		<form class='space-y-8' method='post' onSubmit={handleSubmit} autoComplete='off'>
			<div class='grid gap-8'>
				{/* Note Content Field */}
				<FormGroup>
					<Label
						class='block text-white text-lg font-semibold mb-2'
						htmlFor='content'
						required
					>
						Note Content
					</Label>
					<Textarea
						class='w-full h-52'
						placeholder='Type your note here...'
						name='content'
						id='content'
						required
					>
					</Textarea>
				</FormGroup>

				{/* Password Field */}
				<FormGroup>
					<Label
						htmlFor='password'
						title='Set a password to protect and encrypt your note'
					>
						Password (Optional)
					</Label>
					<PasswordToggle
						name='password'
						id='password'
						placeholder='Enter to set a password'
						helpText='Add password protection for enhanced security, leave blank for no password'
					/>
				</FormGroup>

				{/* Expiration Field */}
				<FormGroup>
					<Label htmlFor='expiresIn'>
						Expire After
					</Label>

					<Select
						name='expiresIn'
						id='expiresIn'
						defaultValue='24h'
						helpText='Note will automatically self-destruct after this time period'
					>
						{expirationOptions.map((option) => (
							<SelectOption
								key={option}
								value={option}
								selected={option === '24 hours'}
							>
								{option}
							</SelectOption>
						))}
					</Select>
				</FormGroup>

				{/* Advanced Options */}
				<Collapsible title='Advanced Options'>
					<Label htmlFor='manualDeletion'>
						Manual Deletion
					</Label>
					<Select
						name='manualDeletion'
						id='manualDeletion'
						defaultValue='disabled'
						helpText={`Let anybody with access to the note delete it manually at any time. This will turn off self-destruction after viewing - use with caution.`}
					>
						{manualDeletionOptions.map((option) => (
							<SelectOption
								key={option}
								value={option}
								selected={option === 'disabled'}
							>
								{option}
							</SelectOption>
						))}
					</Select>
				</Collapsible>
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
