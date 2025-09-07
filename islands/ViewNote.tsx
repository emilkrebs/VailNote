import { useEffect, useRef, useState } from 'preact/hooks';
import HomeButton from '../components/HomeButton.tsx';
import Message from '../components/Message.tsx';
import PenIcon from '../components/PenIcon.tsx';
import SiteHeader from '../components/SiteHeader.tsx';
import PasswordInput from './PasswordInput.tsx';
import { Button } from '../components/Button.tsx';
import { formatExpirationMessage, Note } from '../types/types.ts';
import { decryptNoteContent } from '../lib/encryption.ts';
import LoadingPage from '../components/LoadingPage.tsx';
import NoteService from '../lib/services/note-service.ts';
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from '../components/Card.tsx';
import { FormGroup, Label } from '../components/Form.tsx';
import { NoteErrorPage } from '../routes/[id].tsx';
import { ViewNoteSchema, viewNoteSchema } from '../lib/validation/note.ts';
import * as v from '@valibot/valibot';

// Constants for messages
const MESSAGES = {
	NO_AUTH_KEY: 'No auth key provided, note requires password',
	MANUAL_DELETION_PROMPT: 'The note has been retrieved. Click the button below to delete it.',
	AUTO_DELETION_COMPLETE: 'This note has been destroyed. It will not be retrievable again.',
	DECRYPTION_FAILED: 'Failed to decrypt note with provided authentication key',
	ENTER_PASSWORD: 'Please enter a password',
	NOTE_NOT_AVAILABLE: 'Note data not available',
	INVALID_PASSWORD: 'Incorrect password. Please try again.',
	NO_PASSWORD: 'No password provided. Deletion cancelled.',
	DELETE_SUCCESS: 'Note deleted successfully. Redirecting...',
} as const;

interface ViewEncryptedNoteProps {
	noteId: string;
	manualDeletion?: boolean;
}

interface PasswordRequiredViewProps {
	onSubmit: (event: Event) => Promise<void>;
	error?: string;
	manualDeletion?: boolean;
}

interface DisplayDecryptedNoteProps {
	content: string;
	message?: string;
	manualDeletion?: boolean;
	expiresIn: Date;
	onDeleteNote: () => void;
}

// https://vailnote.com/[id]#[authKey] or https://vailnote.com/[id] (password required)
export default function ViewEncryptedNote(
	{ noteId, manualDeletion }: ViewEncryptedNoteProps,
) {
	// State management
	const [note, setNote] = useState<Note | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [needsPassword, setNeedsPassword] = useState(false);
	const [confirmed, setConfirmed] = useState(manualDeletion ? true : false);
	const [decryptionError, setDecryptionError] = useState<string | undefined>(
		undefined,
	);
	const [message, setMessage] = useState<string | undefined>(undefined);

	const password = useRef<string | undefined>(undefined);

	// Helper functions
	const getAuthKey = (): string | null => {
		const url = new URL(globalThis.location.href);
		let authKey = url.searchParams.get('auth');
		if (!authKey) {
			const hash = globalThis.location.hash.slice(1);
			authKey = new URLSearchParams(hash).get('auth');
		}
		return authKey;
	};

	const showPasswordPrompt = () => {
		setNote(null);
		setNeedsPassword(true);
		setLoading(false);
	};

	const handleAuthKey = async (authKey: string) => {
		try {
			const result = await NoteService.getNote(noteId, authKey);
			if (!result.success || !result.note) {
				throw new Error(result.message);
			}

			password.current = manualDeletion ? authKey : undefined;
			const decryptedContent = await decryptNoteContent(
				result.note.content,
				result.note.iv,
				authKey,
			);

			setNote({ ...result.note, content: decryptedContent });
			setMessage(
				result.note.manualDeletion ? MESSAGES.MANUAL_DELETION_PROMPT : MESSAGES.AUTO_DELETION_COMPLETE,
			);
		} catch (err) {
			console.error(MESSAGES.DECRYPTION_FAILED, err);
			setError(MESSAGES.DECRYPTION_FAILED);
		}
	};

	const fetchAndDecryptNote = async () => {
		try {
			setLoading(true);
			const authKey = getAuthKey();

			if (authKey) {
				await handleAuthKey(authKey);
			} else {
				showPasswordPrompt();
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : MESSAGES.DECRYPTION_FAILED);
		} finally {
			setLoading(false);
		}
	};

	// Main effect for handling note loading logic
	useEffect(() => {
		const authKey = getAuthKey();

		// Show password prompt if no auth key and not confirmed
		if (!authKey) {
			if (!confirmed || manualDeletion) {
				showPasswordPrompt();
			}
			return;
		}

		// Fetch note only when confirmed and auth key is available
		if (confirmed) {
			fetchAndDecryptNote();
		}
	}, [confirmed, noteId, manualDeletion]);

	// Event handlers
	const handlePasswordSubmit = async (event: Event) => {
		event.preventDefault();
		setLoading(true);

		const form = event.target as HTMLFormElement;
		const data = Object.fromEntries(new FormData(form));
		const formData = v.parse(viewNoteSchema, data) as ViewNoteSchema;

		const password = formData.password;

		if (!password.trim()) {
			setDecryptionError(MESSAGES.ENTER_PASSWORD);
			setLoading(false);
			return;
		}

		try {
			setDecryptionError(undefined);
			const result = await NoteService.getNote(noteId, password);

			if (!result.success || !result.note) {
				setDecryptionError(MESSAGES.INVALID_PASSWORD);
				setLoading(false);
				return;
			}

			const decryptedContent = await decryptNoteContent(
				result.note.content,
				result.note.iv,
				password,
			);

			setNote({ ...result.note, content: decryptedContent });
			setNeedsPassword(false);
			setConfirmed(true);
			setMessage(
				manualDeletion ? MESSAGES.MANUAL_DELETION_PROMPT : MESSAGES.AUTO_DELETION_COMPLETE,
			);
		} catch (error) {
			setDecryptionError(MESSAGES.INVALID_PASSWORD);
			console.error('Decryption failed:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteNote = async () => {
		if (!password.current) {
			setMessage(MESSAGES.NO_PASSWORD);
			return;
		}

		try {
			await NoteService.deleteNote(noteId, password.current);
			setMessage(MESSAGES.DELETE_SUCCESS);
			globalThis.location.href = '/';
		} catch (error) {
			console.error('Failed to delete note:', error);
			setMessage('Failed to delete note. Please try again.');
		}
	};

	// Render logic
	if (error) {
		return <NoteErrorPage message={error} />;
	}

	if (needsPassword) {
		return (
			<PasswordRequiredView
				onSubmit={handlePasswordSubmit}
				error={decryptionError}
				manualDeletion={manualDeletion}
			/>
		);
	}

	if (loading) {
		return (
			<LoadingPage
				title='Decrypting Note'
				message='Please wait while we securely decrypt your note...'
			/>
		);
	}

	if (!confirmed) {
		return <ConfirmViewNote onSubmit={() => setConfirmed(true)} />;
	}

	if (!note) {
		return <NoteErrorPage message={MESSAGES.NOTE_NOT_AVAILABLE} />;
	}

	return (
		<DisplayDecryptedNote
			content={note.content}
			message={message}
			manualDeletion={manualDeletion}
			expiresIn={note.expiresIn}
			onDeleteNote={handleDeleteNote}
		/>
	);
}

interface DisplayDecryptedNoteProps {
	content: string;
	message?: string;
	manualDeletion?: boolean;
	expiresIn: Date;
	onDeleteNote: () => void;
}

function DisplayDecryptedNote(
	{ content, message, manualDeletion, expiresIn, onDeleteNote }: DisplayDecryptedNoteProps,
) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<Card>
					{/* Header with icon and title */}
					<CardHeader>
						<CardTitle>
							<div class='flex items-center justify-start gap-3'>
								<div class='p-3 bg-blue-600/20 rounded-xl'>
									<PenIcon />
								</div>
								<div>
									Note Retrieved
									{manualDeletion && (
										<ExpirationMessage
											expiresIn={expiresIn}
										/>
									)}
								</div>
							</div>
						</CardTitle>
						<Message variant='success'>
							{message || MESSAGES.AUTO_DELETION_COMPLETE}
						</Message>
					</CardHeader>

					{/* Content section */}
					<CardContent>
						<div class='flex items-center gap-2 mb-4'>
							<svg
								class='w-5 h-5 text-gray-300'
								fill='currentColor'
								viewBox='0 0 20 20'
							>
								<path
									fill-rule='evenodd'
									d='M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z'
									clip-rule='evenodd'
								/>
							</svg>
							<h3 class='text-xl font-semibold text-white'>Content</h3>
						</div>

						<div class='relative bg-gray-900/80 rounded-lg p-6 shadow-inner border border-gray-700/50 max-w-full max-h-96 overflow-auto'>
							<p class='inline break-words break-all text-gray-100 leading-relaxed text-base pr-12'>
								{content}
							</p>
						</div>
					</CardContent>

					<CardFooter>
						<div class='flex flex-col sm:flex-row gap-4'>
							<HomeButton />
							{manualDeletion && (
								<Button variant='danger' onClick={onDeleteNote}>
									Delete Note
								</Button>
							)}
						</div>
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}

function PasswordRequiredView(
	{ onSubmit, manualDeletion, error }: PasswordRequiredViewProps,
) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<Card>
					<CardHeader>
						<div class='flex items-center justify-start gap-3'>
							<div class='p-3 bg-blue-600/20 rounded-xl'>
								<PenIcon />
							</div>
							Enter Password
						</div>
						<p class='text-yellow-300 text-sm font-medium'>
							This note is encrypted and requires a password
						</p>

						{error && (
							<div class='mb-6 p-4 rounded-lg border bg-red-600/20 border-red-400 text-red-200'>
								<span class='font-medium'>{error}</span>
							</div>
						)}
					</CardHeader>

					<CardContent>
						{!manualDeletion && <WarningMessage />}

						<NoScriptWarning />

						{/* Password form */}
						<form className='space-y-6' onSubmit={onSubmit} autoComplete='off'>
							<FormGroup>
								<Label htmlFor='password'>
									Enter Password
								</Label>
								<PasswordInput
									type='password'
									name='password'
									id='password'
									placeholder='Enter password to decrypt note'
									required
								/>
							</FormGroup>
							<Button
								type='submit'
								variant={manualDeletion ? 'primary' : 'danger'}
								class='w-full'
							>
								{manualDeletion ? 'View Note' : 'View & Destroy'}
							</Button>
						</form>
					</CardContent>

					<CardFooter>
						<HomeButton class='w-full' />
					</CardFooter>
				</Card>
			</div>
		</div>
	);
}

function ConfirmViewNote({ onSubmit }: { onSubmit: () => void }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<Card>
					{/* Header */}
					<CardHeader>
						<CardTitle>Confirm View & Destroy</CardTitle>
						<p class='text-gray-300 text-base leading-relaxed'>
							This action is{' '}
							<span class='text-red-400 font-semibold'>irreversible</span>. The note will be permanently destroyed after
							viewing.
						</p>
					</CardHeader>

					<CardContent>
						<WarningMessage />

						<NoScriptWarning />

						<div class='flex flex-col sm:flex-row w-full justify-between gap-4'>
							<HomeButton class='w-full sm:min-w-max' />
							<Button variant='danger' class='w-full' onClick={onSubmit}>
								View and Destroy Note
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

function WarningMessage() {
	return (
		<div class='bg-red-900/20 border border-red-700/30 rounded-xl p-6 mb-8'>
			<div class='flex items-start gap-4'>
				<svg
					class='w-6 h-6 text-red-400 mt-1 flex-shrink-0'
					fill='currentColor'
					viewBox='0 0 20 20'
				>
					<path
						fill-rule='evenodd'
						d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z'
						clip-rule='evenodd'
					>
					</path>
				</svg>
				<div>
					<h3 class='text-red-300 font-semibold text-lg mb-2'>
						What happens next:
					</h3>
					<ul class='text-red-200 text-sm space-y-2'>
						<li class='flex items-center gap-2'>
							<span class='w-1.5 h-1.5 bg-red-400 rounded-full'></span>
							Note content will be decrypted in your browser
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

function ExpirationMessage({ expiresIn }: { expiresIn: Date }) {
	const [message, setMessage] = useState('');

	const updateMessage = () => {
		const timeString = formatExpirationMessage(expiresIn);
		setMessage(`Expires in: ${timeString}`);
	};

	useEffect(() => {
		updateMessage();
		const interval = setInterval(updateMessage, 1000);
		return () => clearInterval(interval);
	}, [expiresIn]);

	return (
		<p class='text-yellow-300 text-xs font-medium mt-1'>
			{message}
		</p>
	);
}

function NoScriptWarning() {
	return (
		<noscript>
			<div class='bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-6 mb-8'>
				<div class='flex items-start gap-4'>
					<svg
						class='w-6 h-6 text-yellow-400 mt-1 flex-shrink-0'
						fill='currentColor'
						viewBox='0 0 20 20'
					>
						<path
							fill-rule='evenodd'
							d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z'
							clip-rule='evenodd'
						/>
					</svg>
					<div>
						<h3 class='text-yellow-300 font-semibold text-lg mb-2'>
							JavaScript is required
						</h3>
						<p class='text-yellow-200 text-sm'>
							To ensure the security and functionality of VailNote, please enable JavaScript in your browser settings.
							{' '}
							<a
								href='https://www.enable-javascript.com/'
								target='_blank'
								rel='noopener noreferrer'
								class='underline'
							>
								Learn more
							</a>
						</p>
					</div>
				</div>
			</div>
		</noscript>
	);
}
