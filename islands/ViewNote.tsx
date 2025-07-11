import { useState, useEffect } from 'preact/hooks';
import Header from '../components/Header.tsx';
import HomeButton from '../components/HomeButton.tsx';
import Message from '../components/Message.tsx';
import PenIcon from '../components/PenIcon.tsx';
import SiteHeader from '../components/SiteHeader.tsx';
import PasswordInput from './PasswordInput.tsx';
import { Button } from '../components/Button.tsx';
import { Note } from '../types/types.ts';
import { decryptNoteContent } from '../utils/encryption.ts';


async function deleteNote(noteId: string) {
    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
        });
        
        if (!response.ok) {
            console.warn('Failed to delete note from server (note may have already been deleted)');
        }
    } catch (err) {
        console.warn('Failed to delete note from server:', err);
    }
}

async function getEncryptedNote(noteId: string) {
    const response = await fetch(`/api/notes/${noteId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch note');
    }

    return response.json();
}

// https://vailnote.com/[id]#[authKey] or https://vailnote.com/[id] (password required)
export default function ViewEncryptedNote(
    { noteId, message }: { noteId: string; message?: string },
) {
   
    const [note, setNote] = useState<Note | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [decryptionError, setDecryptionError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndDecryptNote = async () => {
            try {
                setLoading(true);
                const data = await getEncryptedNote(noteId);
                if (!data) {
                    throw new Error('Note not found');
                }
                
                // Check hash fragment (#auth=...) and query parameters (?auth=...)
                const url = new URL(globalThis.location.href);
                let authKey = url.searchParams.get('auth'); // Check query parameters first (?auth=...)
                
                if (!authKey) {
                    // Check hash fragment (#auth=...)
                    const hash = globalThis.location.hash.slice(1); // Remove the # symbol
                    authKey = new URLSearchParams(hash).get('auth');
                }
                
                if (authKey) {
                    // We have an auth key, try to decrypt immediately (no password needed)
                    try {
                        const decryptedContent = await decryptNoteContent(data.content, data.iv, authKey);
                        data.content = decryptedContent;
                        setNote(data);
                        setLoading(false);
                        // Delete the note after successful decryption
                        await deleteNote(noteId);
                    } catch (_decryptErr) {
                        setError('Failed to decrypt note with provided authentication key');
                        setLoading(false);
                    }
                } else {
                    // No auth key, this note needs a password - store encrypted data and show password form
                    setNote(data); // Store encrypted note data
                    setNeedsPassword(true);
                    setLoading(false);
                }
            } catch (err) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unknown error occurred');
                }
                setLoading(false);
            }
        };

        // Only fetch when confirmed or when we have an auth key (no confirmation needed for auth key notes)
        if (confirmed) {
            fetchAndDecryptNote();
        }
    }, [confirmed, noteId]);

    const handlePasswordSubmit = async (event: Event) => {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);
        const password = formData.get('password')?.toString() || '';

        if (!password.trim()) {
            setDecryptionError('Please enter a password');
            return;
        }

        if (!note) {
            setDecryptionError('Note data not available');
            return;
        }

        try {
            setDecryptionError(null);
            const decryptedContent = await decryptNoteContent(note.content, note.iv, password);
            setNote({ ...note, content: decryptedContent });
            setNeedsPassword(false);
            // Delete the note after successful decryption
            await deleteNote(noteId);
        } catch (_decryptErr) {
            setDecryptionError('Incorrect password. Please try again.');
        }
    };


    if (error) {
        return <NoteErrorPage message={error} />;
    }
    
    if (!confirmed) {
        return <ConfirmViewNote onSubmit={() => setConfirmed(true)} />;
    }


    if (loading) {
        return <LoadingSpinner />;
    }

    if (needsPassword) {
        return <PasswordRequiredView onSubmit={handlePasswordSubmit} error={decryptionError} />;
    }

    if (!note) {
        return <NoteErrorPage message="Note not found" />;
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

                    <div class='mt-8 pt-6 border-t border-gray-600/50 w-full'>
                        <HomeButton class='w-full' />
                    </div>
                </div>
            </div>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <div class='flex items-center justify-center min-h-screen'>
            <svg class='animate-spin h-5 w-5 text-white' viewBox='0 0 24 24'>
                <circle class='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                <path class='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 100 8v4a8 8 0 01-8-8z'></path>
            </svg>
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