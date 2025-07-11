import { useEffect, useRef, useState } from 'preact/hooks';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import Message from '../components/Message.tsx';
import PenIcon from '../components/PenIcon.tsx';
import SiteHeader from '../components/SiteHeader.tsx';
import PasswordInput from './PasswordInput.tsx';
import { Button } from '../components/Button.tsx';
import { Note } from '../types/types.ts';
import { decryptNoteContent } from '../utils/encryption.ts';
import { generateDeterministicClientHash } from '../utils/hashing.ts';

interface ViewEncryptedNoteProps {
	noteId: string;
	manualDeletion?: boolean;
}

async function deleteNote(noteId: string, password: string) {
	try {
		const passwordHash = await generateDeterministicClientHash(password);
		const response = await fetch(`/api/notes/${noteId}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ passwordHash }),
		});

		if (!response.ok) {
			console.warn('Failed to delete note from server (note may have already been deleted)');
		}
	} catch (err) {
		console.warn('Failed to delete note from server:', err);
	}
}

async function getEncryptedNote(noteId: string, password: string) {
	const passwordHash = await generateDeterministicClientHash(password);
	const response = await fetch(`/api/notes/${noteId}`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ passwordHash }),
	});

	if (!response.ok) {
		throw new Error('Failed to fetch note: ' + await response.text());
	}

	return response.json();
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
	const [decryptionError, setDecryptionError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

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

		const authKey = getAuthKey();

		// If not confirmed and no auth key, show confirmation or password prompt
		if (!authKey && !confirmed) {
			setNote(null);
			setNeedsPassword(true);
			setLoading(false);
			console.warn('No auth key provided, note requires password');
			return;
		}

		// If already confirmed and no password is needed, do nothing
		if (!needsPassword && confirmed) {
			return;
		}

		// Fetch and decrypt note (for both auth key and password flows)
		const fetchAndDecryptNote = async () => {
			try {
				setLoading(true);

				if (authKey) {
					try {
						const data = await getEncryptedNote(noteId, authKey) as Note;
						if (!data) throw new Error('Note not found');
						notePassword.current = manualDeletion ? authKey : undefined;
						console.log('Set note password:', notePassword);
						const decryptedContent = await decryptNoteContent(data.content, data.iv, authKey);
						data.content = decryptedContent;
						setNote(data);
						setMessage(
							data.manualDeletion
								? 'The note has been retrieved. Click the button below to delete it.'
								: 'This note has been destroyed. It will not be retrievable again.',
						);
					} catch (err) {
						console.error('Failed to decrypt note with provided authentication key', err);
						setError('Failed to decrypt note with provided authentication key');
					}
				} else {
					// Password flow: show password form
					setNote(null);
					setNeedsPassword(true);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An unknown error occurred');
			} finally {
				setLoading(false);
			}
		};

		// Only fetch when confirmed or when we have an auth key (no confirmation needed for auth key notes)
		if (confirmed || authKey) {
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
			setDecryptionError('Please enter a password');
			return;
		}

		try {
			setDecryptionError(null);
			const data = await getEncryptedNote(noteId, password);

			if (!data) {
				setDecryptionError('Note data not available');
				return;
			}
			notePassword.current = manualDeletion ? password : undefined;
			const decryptedContent = await decryptNoteContent(data.content, data.iv, password);
			data.content = decryptedContent;

			setNote(data);
			setNeedsPassword(false);
			setConfirmed(true);
			setLoading(false);
			setMessage('Note decrypted successfully');
		} catch (_decryptErr) {
			setDecryptionError('Incorrect password. Please try again.');
			console.error('Decryption failed:', _decryptErr);
		}
	};

	const handleDeleteNote = async (noteId: string) => {
		if (!notePassword.current) {
			setMessage('No password provided. Deletion cancelled.');
			return;
		}
		await deleteNote(noteId, notePassword.current);
		setMessage('Note deleted successfully.');
	};

	if (error) {
		return <NoteErrorPage message={error} />;
	}

	if (!confirmed && !needsPassword && !manualDeletion) {
		return <ConfirmViewNote onSubmit={() => setConfirmed(true)} />;
	}

	if (loading) {
		return <LoadingSpinner />;
	}

	if (needsPassword) {
		return <PasswordRequiredView onSubmit={handlePasswordSubmit} error={decryptionError} />;
	}

	if (!note) {
		return <NoteErrorPage message={message || 'Note not found'} />;
	}

	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<Header title='Note Retrieved' description='Successfully decrypted and displayed' />
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
							<p class='text-green-300 text-sm font-medium'>Successfully decrypted and destroyed</p>
						</div>
					</div>

					<Message
						message={message || 'This note has been destroyed. It will not be retrievable again.'}
						type='success'
					/>

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

					{/* Action buttons */}
					<div class='flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t border-gray-600/50 w-full'>
						<HomeButton />

						{note.manualDeletion && (
							<Button color='danger' onClick={() => handleDeleteNote(note.id)}>
								Delete Note
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function LoadingSpinner() {
	return (
		<div class='flex flex-col items-center justify-center min-h-screen h-full w-full background-animate text-white py-16'>
			<Header title='Loading...' description='Decrypting your secure note' />
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col items-center mt-6 p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
					{/* Animated spinner */}
					<div class='relative mb-8'>
						<div class='w-16 h-16 border-4 border-gray-600 border-t-blue-400 border-r-blue-400 rounded-full animate-spin'>
						</div>
						<div class='absolute inset-2 w-12 h-12 border-2 border-gray-700 border-b-purple-400 border-l-purple-400 rounded-full animate-spin animate-reverse'>
						</div>
						<div class='absolute inset-4 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse'>
						</div>
					</div>

					{/* Loading text */}
					<div class='text-center'>
						<h2 class='text-2xl font-bold text-white mb-2'>Decrypting Note</h2>
						<p class='text-gray-300 text-sm'>
							Please wait while we securely decrypt your note...
						</p>
					</div>

					{/* Progress dots */}
					<div class='flex space-x-2 mt-6'>
						<div class='w-2 h-2 bg-blue-400 rounded-full animate-bounce'></div>
						<div class='w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.1s]'></div>
						<div class='w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]'></div>
					</div>
				</div>
			</div>
		</div>
	);
}

function PasswordRequiredView({ onSubmit, error }: { onSubmit: (event: Event) => void; error: string | null }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<Header title='Password Protected' description='This note requires a password to decrypt' />
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
							<p class='text-blue-300 text-sm font-medium'>This note is encrypted and requires a password</p>
						</div>
					</div>

					{error && (
						<div class='mb-6 p-4 rounded-lg border bg-red-600/20 border-red-400 text-red-200'>
							<span class='font-medium'>{error}</span>
						</div>
					)}

					<WarningMessage />

					<NoScriptWarning />

					{/* Password input form */}
					<form onSubmit={onSubmit} class='space-y-6' autoComplete='off'>
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
							Decrypt and View Note
						</Button>
					</form>

					<div class='mt-8 pt-6 border-t border-gray-600/50 w-full'>
						<HomeButton class='w-full' />
					</div>
				</div>
			</div>
		</div>
	);
}

function ConfirmViewNote({ onSubmit }: { onSubmit: () => void }) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<Header title='Confirm View & Destroy' />
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
							<Button color='danger' class='w-full' onClick={onSubmit}>
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
		<noscript class='bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-6 mb-8'>
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
		</noscript>
	);
}
