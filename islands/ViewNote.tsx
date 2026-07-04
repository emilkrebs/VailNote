import { useEffect, useRef, useState } from 'preact/hooks';
import HomeButton from '../components/HomeButton.tsx';
import Message from '../components/Message.tsx';
import PageShell from '../components/PageShell.tsx';
import { Button } from '../components/Button.tsx';
import { formatExpirationMessage, Note } from '../lib/types.ts';
import { decryptNoteContent } from '../lib/encryption.ts';
import { combineNoteSecrets } from '../lib/services/crypto-service.ts';
import LoadingPage from '../components/LoadingPage.tsx';
import NoteService from '../lib/services/note-service.ts';
import Card, { CardContent, CardFooter, CardHeader, CardTitle } from '../components/Card.tsx';
import { FormGroup, Label } from '../components/Form.tsx';
import { ViewNoteSchema, viewNoteSchema } from '../lib/validation/note.ts';
import * as v from '@valibot/valibot';
import ErrorPage from '../components/ErrorPage.tsx';
import PasswordToggle from '../components/PasswordToggle.tsx';
import CopyButton from '../components/CopyButton.tsx';
import { ClockCountdownIcon, EyeIcon, FireIcon, TrashSimpleIcon, WarningIcon } from '../components/Icons.tsx';

// Constants for messages
const MESSAGES = {
    NO_AUTH_KEY: 'No auth key provided, note requires password',
    MANUAL_DELETION_PROMPT: 'The note has been retrieved. You can delete it below at any time.',
    AUTO_DELETION_COMPLETE: 'This note has been destroyed. It cannot be retrieved again.',
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
export default function ViewEncryptedNote({ noteId, manualDeletion }: ViewEncryptedNoteProps) {
    // State management
    const [note, setNote] = useState<Note | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [confirmed, setConfirmed] = useState(manualDeletion ? true : false);
    const [decryptionError, setDecryptionError] = useState<string | undefined>(undefined);
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
                // Password-protected notes reject the auth key alone (403);
                // the password prompt collects the second factor.
                if (result.message?.includes('Invalid password')) {
                    showPasswordPrompt();
                    return;
                }
                throw new Error(result.message);
            }

            password.current = manualDeletion ? authKey : undefined;
            const decryptedContent = await decryptNoteContent(result.note.content, result.note.iv, authKey);

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

        const enteredPassword = formData.password;

        if (!enteredPassword.trim()) {
            setDecryptionError(MESSAGES.ENTER_PASSWORD);
            setLoading(false);
            return;
        }

        try {
            setDecryptionError(undefined);
            const result = await NoteService.getNote(noteId, enteredPassword);

            if (!result.success || !result.note) {
                setDecryptionError(MESSAGES.INVALID_PASSWORD);
                setLoading(false);
                return;
            }

            // Notes created with a link auth key are encrypted with password + auth key
            // combined; older password-only notes fall back to the password alone.
            const authKey = getAuthKey();
            const decryptionKey = authKey ? combineNoteSecrets(enteredPassword, authKey) : enteredPassword;
            const decryptedContent = await decryptNoteContent(result.note.content, result.note.iv, decryptionKey);

            password.current = manualDeletion ? enteredPassword : undefined;
            setNote({ ...result.note, content: decryptedContent });
            setNeedsPassword(false);
            setConfirmed(true);
            setMessage(manualDeletion ? MESSAGES.MANUAL_DELETION_PROMPT : MESSAGES.AUTO_DELETION_COMPLETE);
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
        return <ErrorPage message={error} />;
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
                title='Decrypting note'
                message='Your browser is decrypting the note locally.'
            />
        );
    }

    if (!confirmed) {
        return <ConfirmViewNote onSubmit={() => setConfirmed(true)} />;
    }

    if (!note) {
        return <ErrorPage message={MESSAGES.NOTE_NOT_AVAILABLE} />;
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

function DisplayDecryptedNote(
    { content, message, manualDeletion, expiresIn, onDeleteNote }: DisplayDecryptedNoteProps,
) {
    return (
        <PageShell>
            <Card>
                <CardHeader>
                    <CardTitle>Note decrypted</CardTitle>
                    {manualDeletion && <ExpirationMessage expiresIn={expiresIn} />}
                    <Message variant='success'>
                        {message || MESSAGES.AUTO_DELETION_COMPLETE}
                    </Message>
                </CardHeader>

                <CardContent>
                    <div class='mb-2 flex items-center justify-between gap-2'>
                        <h3 class='text-sm font-medium text-muted'>Contents</h3>
                        <CopyButton value={content} label='Copy note contents' />
                    </div>

                    <div class='max-h-96 overflow-auto rounded-control border border-line-strong bg-bg p-4'>
                        <div class='font-mono text-sm leading-relaxed text-ink whitespace-pre-wrap wrap-break-word'>
                            {content}
                        </div>
                    </div>
                </CardContent>

                <CardFooter>
                    <div class='flex flex-col gap-3 sm:flex-row'>
                        <HomeButton />
                        {manualDeletion && (
                            <Button variant='danger' onClick={onDeleteNote}>
                                <TrashSimpleIcon size={17} />
                                Delete note
                            </Button>
                        )}
                    </div>
                </CardFooter>
            </Card>
        </PageShell>
    );
}

function PasswordRequiredView({ onSubmit, manualDeletion, error }: PasswordRequiredViewProps) {
    return (
        <PageShell>
            <Card>
                <CardHeader>
                    <CardTitle>This note is locked</CardTitle>
                    <p class='text-[0.9375rem] leading-relaxed text-muted'>
                        Enter the password it was created with. Decryption happens in your browser.
                    </p>
                </CardHeader>

                <CardContent class='flex flex-col gap-6'>
                    {!manualDeletion && <DestroyFacts />}

                    <NoScriptWarning />

                    <form class='flex flex-col gap-6' onSubmit={onSubmit} autoComplete='off'>
                        <FormGroup>
                            <Label htmlFor='password'>
                                Password
                            </Label>
                            <PasswordToggle
                                type='password'
                                name='password'
                                id='password'
                                placeholder='Password for this note'
                                error={error}
                                autoFocus
                                autoComplete='off'
                                required
                            />
                        </FormGroup>
                        <Button type='submit' variant={manualDeletion ? 'primary' : 'danger'} class='w-full'>
                            {manualDeletion ? 'Decrypt note' : 'Decrypt and destroy'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter>
                    <HomeButton class='w-full' />
                </CardFooter>
            </Card>
        </PageShell>
    );
}

function ConfirmViewNote({ onSubmit }: { onSubmit: () => void }) {
    return (
        <PageShell>
            <Card>
                <CardHeader>
                    <CardTitle>View and destroy this note?</CardTitle>
                    <p class='text-[0.9375rem] leading-relaxed text-muted'>
                        This note can be read exactly once. Decrypting it deletes it from the server permanently.
                    </p>
                </CardHeader>

                <CardContent class='flex flex-col gap-6'>
                    <DestroyFacts />

                    <NoScriptWarning />

                    <div class='flex flex-col gap-3 sm:flex-row-reverse sm:justify-between'>
                        <Button variant='danger' class='w-full sm:w-auto' onClick={onSubmit}>
                            <FireIcon size={17} />
                            View and destroy note
                        </Button>
                        <HomeButton class='w-full sm:w-auto' />
                    </div>
                </CardContent>
            </Card>
        </PageShell>
    );
}

const destroyFacts = [
    { icon: EyeIcon, text: 'The note decrypts in your browser, not on the server.' },
    { icon: FireIcon, text: 'It is deleted from the server the moment it is retrieved.' },
    { icon: WarningIcon, text: 'There is no undo and no second view.' },
];

function DestroyFacts() {
    return (
        <ul class='flex flex-col gap-3 rounded-control border border-line bg-bg/50 p-4'>
            {destroyFacts.map((fact) => (
                <li key={fact.text} class='flex items-start gap-3 text-[0.9375rem] leading-relaxed text-muted'>
                    <fact.icon size={18} class='mt-0.5 shrink-0 text-warn' />
                    {fact.text}
                </li>
            ))}
        </ul>
    );
}

function ExpirationMessage({ expiresIn }: { expiresIn: Date }) {
    const [message, setMessage] = useState('');

    const updateMessage = () => {
        const timeString = formatExpirationMessage(expiresIn);
        setMessage(`Expires in ${timeString}`);
    };

    useEffect(() => {
        updateMessage();
        const interval = setInterval(updateMessage, 1000);
        return () => clearInterval(interval);
    }, [expiresIn]);

    return (
        <p class='flex items-center gap-1.5 font-mono text-sm text-warn'>
            <ClockCountdownIcon size={16} class='shrink-0' />
            {message}
        </p>
    );
}

function NoScriptWarning() {
    return (
        <noscript>
            <Message variant='warning'>
                <p class='font-semibold'>JavaScript is required</p>
                <p class='mt-1 text-sm'>
                    Notes are decrypted in your browser, never on the server, and that needs JavaScript. Enable it in
                    your browser settings to continue.{' '}
                    <a
                        href='https://www.enable-javascript.com/'
                        target='_blank'
                        rel='noopener noreferrer'
                        class='underline underline-offset-2'
                    >
                        Learn more
                    </a>
                </p>
            </Message>
        </noscript>
    );
}
