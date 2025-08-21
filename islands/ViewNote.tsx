import { useEffect, useRef, useState } from 'preact/hooks';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import Message from '../components/Message.tsx';
import PenIcon from '../components/PenIcon.tsx';
import SiteHeader from '../components/SiteHeader.tsx';
import PasswordInput from './PasswordInput.tsx';
import { Button } from '../components/Button.tsx';
import { formatExpiration, formatExpirationMessage, Note } from '../types/types.ts';
import { decryptNoteContent } from '../utils/encryption.ts';
import NoteAPIService from '../utils/note-api-service.ts';
import LoadingPage from '../components/LoadingPage.tsx';
import { needsEncoding } from '$std/media_types/_util.ts';

// Constants for messages
const MESSAGES = {
	NO_AUTH_KEY: 'No auth key provided, note requires password',
	MANUAL_DELETION_PROMPT: 'The note has been retrieved. Click the button below to delete it.',
	AUTO_DELETION_COMPLETE: 'This note has been destroyed. It will not be retrievable again.',
	DECRYPTION_FAILED: 'Failed to decrypt note with provided authentication key',
	ENTER_PASSWORD: 'Please enter a password',
	NOTE_NOT_AVAILABLE: 'Note data not available',
	DECRYPT_SUCCESS: 'Note decrypted successfully',
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

// https://vailnote.com/[id]#[authKey] or https://vailnote.com/[id] (password required)
export default function ViewEncryptedNote(
	{ noteId, manualDeletion }: ViewEncryptedNoteProps,
) {
	const [note, setNote] = useState<Note | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [needsPassword, setNeedsPassword] = useState(false);
	const [confirmed, setConfirmed] = useState(false);
	const [decryptionError, setDecryptionError] = useState<string | undefined>(undefined);
	const [message, setMessage] = useState<string | undefined>(undefined);

	const notePassword = useRef<string | undefined>(undefined);

	useEffect(() => {
		// Helper to extract auth key from URL
		const getAuthKey = () => {
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

		const authKey = getAuthKey();

		// If not confirmed and no auth key, show confirmation or password prompt
		if (!authKey && !confirmed) {
			console.warn('No auth key provided, note requires password');
			return showPasswordPrompt();
		}

		// Fetch and decrypt note (for both auth key and password flows)
		const fetchAndDecryptNote = async () => {
			console.log('Fetching and decrypting note...');
			try {
				setLoading(true);
				console.log('Fetching note...');
				if (authKey) {
					console.log('Fetching note with auth key');
					await handleAuthKey(authKey);
				} else {
					// Password flow: show password form
					showPasswordPrompt();
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : MESSAGES.DECRYPTION_FAILED);
			} finally {
				setLoading(false);
			}
		};

		const handleAuthKey = async (authKey: string) => {
			try {
				const result = await NoteAPIService.getEncryptedNote(noteId, authKey);
				if (!result.success || !result.note) throw new Error(result.message);

				notePassword.current = manualDeletion ? authKey : undefined;
				const decryptedContent = await decryptNoteContent(result.note.content, result.note.iv, authKey);

				setNote(
					{ ...result.note, content: decryptedContent },
				);
				setMessage(
					result.note.manualDeletion ? MESSAGES.MANUAL_DELETION_PROMPT : MESSAGES.AUTO_DELETION_COMPLETE,
				);
			} catch (err) {
				console.error(MESSAGES.DECRYPTION_FAILED, err);
				setError(MESSAGES.DECRYPTION_FAILED);
			}
		};

		// Only fetch automatically when confirmed and when we have an auth key
		if (confirmed && authKey) {
			console.log('Confirmed and auth key present, fetching note...');
			fetchAndDecryptNote();
		}
	}, [confirmed, noteId]);

	const handlePasswordSubmit = async (event: Event) => {
		event.preventDefault();
		setLoading(true);
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);
		const password = formData.get('password')?.toString() || '';

		if (!password.trim()) {
			setDecryptionError(MESSAGES.ENTER_PASSWORD);
			return;
		}

		try {
			setDecryptionError(undefined);
			const result = await NoteAPIService.getEncryptedNote(noteId, password);
			console.log('Note fetch result:', result);
			if (!result.success || !result.note) {
				return setDecryptionError(MESSAGES.INVALID_PASSWORD);
			}
			notePassword.current = manualDeletion ? password : undefined;
			const decryptedContent = await decryptNoteContent(result.note.content, result.note.iv, password);
			result.note.content = decryptedContent;

			setNote(result.note);
			setNeedsPassword(false);
			setConfirmed(true);
			setLoading(false);
			setMessage(MESSAGES.DECRYPT_SUCCESS);
		} catch (_decryptErr) {
			setDecryptionError(MESSAGES.INVALID_PASSWORD);
			console.error('Decryption failed:', _decryptErr);
			setLoading(false);
		}
	};

	const handleDeleteNote = async () => {
		if (!notePassword.current) {
			setMessage(MESSAGES.NO_PASSWORD);
			return;
		}
		await NoteAPIService.deleteNote(noteId, notePassword.current);
		setMessage(MESSAGES.DELETE_SUCCESS);
		globalThis.location.href = '/';
	};

	if (error) {
		return <NoteErrorPage message={error} />;
	}

	if (needsPassword) {
		return <PasswordRequiredView onSubmit={handlePasswordSubmit} error={decryptionError} manualDeletion={manualDeletion} />;
	}

	if (!confirmed && !needsPassword && !manualDeletion) {
		return <ConfirmViewNote onSubmit={() => setConfirmed(true)} />;
	}

	if (loading) {
		return <LoadingPage title='Decrypting Note' message='Please wait while we securely decrypt your note...' />;
	}

	if (!note) {
		return <NoteErrorPage message={message || 'Note not found'} />;
	}

	return (
		<DisplayDecryptedNote
			content={note.content}
			message={message}
			manualDeletion={manualDeletion}
			expiresAt={note.expiresAt}
			onDeleteNote={handleDeleteNote}
		/>
	);
}

interface DisplayDecryptedNoteProps {
	content: string;
	message?: string;
	manualDeletion?: boolean;
	expiresAt: Date;
	onDeleteNote: () => void;
}

function DisplayDecryptedNote({ content, message, manualDeletion, expiresAt, onDeleteNote }: DisplayDecryptedNoteProps) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col mt-6 p-4 sm:p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
					{/* Header with icon and title */}
					<div class='flex items-center justify-start gap-2 mb-6 pb-4 border-b border-gray-600/50'>
						<div class='p-3 bg-gray-800 rounded-xl'>
							<PenIcon />
						</div>
						<div>
							<h2 class='text-3xl font-bold text-white'>Note Retrieved</h2>
							{manualDeletion &&
								<ExpirationMessage expiresAt={expiresAt} />
							}
						</div>
					</div>

					<Message variant='success'>
						{message || MESSAGES.AUTO_DELETION_COMPLETE}
					</Message>

					{/* Content section */}
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
									{content}
								</p>
							</div>
						</div>
					</div>

					{/* Action buttons */}
					<div class='flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-600/50 w-full'>
						<HomeButton />

						{manualDeletion && (
							<Button variant='danger' onClick={onDeleteNote}>
								Delete Note
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function PasswordRequiredView({ onSubmit, manualDeletion, error }: PasswordRequiredViewProps) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col mt-6 p-4 sm:p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
					{/* Header with icon and title */}
					<div class='flex items-center justify-start gap-2 mb-6 pb-4 border-b border-gray-600/50'>
						<div class='p-3 bg-gray-800 rounded-xl'>
							<PenIcon />
						</div>
						<div>
							<h2 class='text-3xl font-bold text-white'>Enter Password</h2>
							<p class='text-yellow-300 text-sm font-medium'>This note is encrypted and requires a password</p>
						</div>
					</div>

					{error && (
						<div class='mb-6 p-4 rounded-lg border bg-red-600/20 border-red-400 text-red-200'>
							<span class='font-medium'>{error}</span>
						</div>
					)}

					{!manualDeletion && <WarningMessage />}

					{manualDeletion && (
						<div class='mb-6 p-4 rounded-lg border bg-yellow-600/20 border-yellow-400 text-yellow-200'>
							<span class='font-medium'>This note will not be deleted automatically. You must delete it manually.</span>
						</div>
					)}

					<NoScriptWarning />

					{/* Password input form */}
					<form class='space-y-6' onSubmit={onSubmit} autoComplete='off'>
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
							type='submit'
							variant='primary'
							class='w-full'
						>
							{manualDeletion ? 'View Note' : 'View & Destroy'}
						</Button>
					</form>

					<div class='block mt-8 pt-6 border-t border-gray-600/50'>
						<HomeButton />
					</div>
				</div>
			</div>
		</div>
	);
}

function ConfirmViewNote({ onSubmit }: { onSubmit: () => void }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='mt-6 p-4 sm:p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
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

					<NoScriptWarning />

					<div class='space-y-6'>
						<div class='flex flex-col sm:flex-row w-full justify-between gap-4'>
							<HomeButton class='w-full sm:min-w-max' />
							<Button variant='danger' class='w-full' onClick={onSubmit}>
								View and Destroy Note
							</Button>
						</div>
					</div>
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

function ExpirationMessage({ expiresAt }: { expiresAt: Date }) {
	const [message, setMessage] = useState(`Expires in: ${formatExpirationMessage(expiresAt)}`);
	const [title, setTitle] = useState(`The note will expire in ${formatExpirationMessage(expiresAt)}. Click the button below to delete it.`);

	const updateMessage = () => {
		const timeString = formatExpirationMessage(expiresAt);
		if (timeString === 'Expired') {
			setTitle('This note has expired and has been deleted.');
		}
		setMessage(`Expires in: ${timeString}`);
		setTitle(`The note will expire in ${timeString}. Click the button below to delete it.`);
	};

	useEffect(() => {
		const interval = setInterval(updateMessage, 1000);
		return () => clearInterval(interval);
	}, []);

	return (
		<p class='text-yellow-300 text-xs font-medium mt-1' title={title}>
			{message}
		</p>
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

function NoScriptWarning() {
	return (
		<noscript>
			<Message variant='warning'>
				<div class='flex items-start gap-4'>
					<svg class='w-6 h-6 text-yellow-400 mt-1 flex-shrink-0' fill='currentColor' viewBox='0 0 20 20'>
						<path
							fill-rule='evenodd'
							d='M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 6a1.5 1.5 0 110-3 1.5 1.5 0 010 3z'
							clip-rule='evenodd'
						>
						</path>
					</svg>
					<div>
						<h3 class='text-yellow-300 font-semibold text-lg mb-2'>JavaScript is required</h3>
						<p class='text-yellow-200 text-sm'>
							To ensure the security and functionality of VailNote, please enable JavaScript in your browser settings.
							{' '}
							<a href='https://www.enable-javascript.com/' target='_blank' rel='noopener noreferrer' class='underline'>
								Learn more
							</a>
						</p>
					</div>
				</div>
			</Message>
		</noscript>
	);
}
