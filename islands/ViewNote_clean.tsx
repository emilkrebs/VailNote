import { useEffect, useRef, useState } from 'preact/hooks';
import { type Note } from '../types/types.ts';
import Header from '../components/Header.tsx';
import SiteHeader from '../components/Header.tsx';
// Message is used in NoteDisplayView component below
import Message from '../components/Message.tsx';
import HomeButton from '../components/HomeButton.tsx';
import PenIcon from '../components/PenIcon.tsx';
import { Button } from '../components/Button.tsx';
import PasswordInput from './PasswordInput.tsx';
import { decryptNoteContent } from '../utils/encryption.ts';

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
	DELETE_SUCCESS: 'Note deleted successfully.',
} as const;

// Service Classes
class NoteApiService {
	static async getEncryptedNote(noteId: string, authKey: string): Promise<Note | null> {
		const response = await fetch(`/api/notes/${noteId}?auth=${encodeURIComponent(authKey)}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch note: ${response.status}`);
		}
		return await response.json();
	}

	static async deleteNote(noteId: string, password: string): Promise<void> {
		const response = await fetch(`/api/notes/${noteId}`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ password }),
		});
		if (!response.ok) {
			throw new Error(`Failed to delete note: ${response.status}`);
		}
	}
}

// Helper Classes
class UrlHelper {
	static extractAuthKey(): string | null {
		const url = new URL(globalThis.location.href);
		let authKey = url.searchParams.get('auth');
		if (!authKey) {
			const hash = globalThis.location.hash.slice(1);
			authKey = new URLSearchParams(hash).get('auth');
		}
		return authKey;
	}
}

// Component Props Interfaces
interface ViewEncryptedNoteProps {
	noteId: string;
	manualDeletion: boolean;
}

// Main Component
// https://vailnote.com/[id]#[authKey] or https://vailnote.com/[id] (password required)
export default function ViewEncryptedNote(
	{ noteId, manualDeletion }: ViewEncryptedNoteProps,
) {
	// State Management
	const [note, setNote] = useState<Note | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [needsPassword, setNeedsPassword] = useState(false);
	const [confirmed, setConfirmed] = useState(false);
	const [decryptionError, setDecryptionError] = useState<string | null>(null);
	const [message, setMessage] = useState<string | null>(null);

	const notePassword = useRef<string | undefined>(undefined);

	// Effects
	useEffect(() => {
		const authKey = UrlHelper.extractAuthKey();

		if (!authKey && !confirmed) {
			setNote(null);
			setNeedsPassword(true);
			setLoading(false);
			console.warn(MESSAGES.NO_AUTH_KEY);
			return;
		}

		if (!needsPassword && confirmed) {
			return;
		}

		const fetchAndDecryptNote = async () => {
			try {
				setLoading(true);

				if (authKey) {
					await handleAuthKeyFlow(authKey);
				} else {
					handlePasswordFlow();
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'An unknown error occurred');
			} finally {
				setLoading(false);
			}
		};

		if (confirmed || authKey) {
			fetchAndDecryptNote();
		}
	}, [confirmed, noteId]);

	// Event Handlers
	const handleAuthKeyFlow = async (authKey: string) => {
		try {
			const data = await NoteApiService.getEncryptedNote(noteId, authKey) as Note;
			if (!data) throw new Error('Note not found');

			notePassword.current = manualDeletion ? authKey : undefined;
			console.log('Set note password:', notePassword);

			const decryptedContent = await decryptNoteContent(data.content, data.iv, authKey);
			data.content = decryptedContent;
			setNote(data);
			setMessage(
				data.manualDeletion ? MESSAGES.MANUAL_DELETION_PROMPT : MESSAGES.AUTO_DELETION_COMPLETE,
			);
		} catch (err) {
			console.error(MESSAGES.DECRYPTION_FAILED, err);
			setError(MESSAGES.DECRYPTION_FAILED);
		}
	};

	const handlePasswordFlow = () => {
		setNote(null);
		setNeedsPassword(true);
	};

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
			setDecryptionError(null);
			const data = await NoteApiService.getEncryptedNote(noteId, password);

			if (!data) {
				setDecryptionError(MESSAGES.NOTE_NOT_AVAILABLE);
				return;
			}

			notePassword.current = manualDeletion ? password : undefined;
			const decryptedContent = await decryptNoteContent(data.content, data.iv, password);
			data.content = decryptedContent;

			setNote(data);
			setNeedsPassword(false);
			setConfirmed(true);
			setLoading(false);
			setMessage(MESSAGES.DECRYPT_SUCCESS);
		} catch (_decryptErr) {
			setDecryptionError(MESSAGES.INVALID_PASSWORD);
			console.error('Decryption failed:', _decryptErr);
		}
	};

	const handleDeleteNote = async (noteId: string) => {
		if (!notePassword.current) {
			setMessage(MESSAGES.NO_PASSWORD);
			return;
		}
		await NoteApiService.deleteNote(noteId, notePassword.current);
		setMessage(MESSAGES.DELETE_SUCCESS);
	};

	// Render Logic
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
		<NoteDisplayView
			note={note}
			message={message}
			onDeleteNote={handleDeleteNote}
		/>
	);
}

// Supporting Components
interface NoteErrorPageProps {
	message: string;
}

function NoteErrorPage({ message }: NoteErrorPageProps) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<Header title='Error' description='Unable to retrieve note' />
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col mt-6 p-4 sm:p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-red-900/95 to-red-800/95 border border-red-600/50 backdrop-blur-sm'>
					<h2 class='text-2xl font-bold text-white mb-4'>Error</h2>
					<p class='text-red-100 mb-6'>{message}</p>
					<HomeButton />
				</div>
			</div>
		</div>
	);
}

interface ConfirmViewNoteProps {
	onSubmit: () => void;
}

function ConfirmViewNote({ onSubmit }: ConfirmViewNoteProps) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<Header title='Confirm View' description='Are you sure you want to view this note?' />
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col mt-6 p-4 sm:p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
					<h2 class='text-2xl font-bold text-white mb-4'>View Note Confirmation</h2>
					<p class='text-gray-100 mb-6'>
						Are you sure you want to view this note? Once viewed, it will be automatically destroyed.
					</p>
					<div class='flex gap-4'>
						<Button onClick={onSubmit}>Yes, View Note</Button>
						<HomeButton />
					</div>
				</div>
			</div>
		</div>
	);
}

function LoadingSpinner() {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<Header title='Loading' description='Retrieving and decrypting note...' />
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col items-center mt-6 p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
					<div class='loading-spinner'></div>
					<p class='text-gray-100 mt-4'>Decrypting your note...</p>
				</div>
			</div>
		</div>
	);
}

interface PasswordRequiredViewProps {
	onSubmit: (event: Event) => Promise<void>;
	error: string | null;
}

function PasswordRequiredView({ onSubmit, error }: PasswordRequiredViewProps) {
	return (
		<div class='flex flex-col items-center min-h-screen h-full w-full background-animate text-white py-16'>
			<Header title='Password Required' description='Enter password to view note' />
			<SiteHeader />
			<div class='flex flex-col items-center justify-center w-full max-w-screen-md mx-auto px-4 py-8'>
				<div class='flex flex-col mt-6 p-4 sm:p-8 rounded-3xl shadow-2xl w-full bg-gradient-to-br from-gray-800/95 to-gray-700/95 border border-gray-600/50 backdrop-blur-sm'>
					<h2 class='text-2xl font-bold text-white mb-4'>Password Required</h2>
					<p class='text-gray-100 mb-6'>
						This note requires a password to view. Enter the password to decrypt and view the content.
					</p>

					<form onSubmit={onSubmit} class='flex flex-col gap-4'>
						<PasswordInput name='password' placeholder='Enter password...' />
						{error && <p class='text-red-400 text-sm'>{error}</p>}
						<div class='flex gap-4'>
							<Button type='submit'>View Note</Button>
							<HomeButton />
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

interface NoteDisplayViewProps {
	note: Note;
	message: string | null;
	onDeleteNote: (noteId: string) => Promise<void>;
}

function NoteDisplayView({ note, message, onDeleteNote }: NoteDisplayViewProps) {
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
							<Button variant='danger' onClick={() => onDeleteNote(note.id)}>
								Delete Note
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
