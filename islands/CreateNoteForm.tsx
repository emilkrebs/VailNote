import { Button } from '../components/Button.tsx';
import { useState } from 'preact/hooks';
import Message from '../components/Message.tsx';
import NoteService from '../lib/services/note-service.ts';
import Card, { CardContent, CardHeader, CardTitle } from '../components/Card.tsx';
import { FormGroup, Label, Select, SelectOption, Textarea } from '../components/Form.tsx';
import * as v from '@valibot/valibot';
import {
    CreateNoteSchema,
    createNoteSchema,
    expirationOptions,
    EXPIRY_OPTIONS,
    MANUAL_DELETION_OPTIONS,
} from '../lib/validation/note.ts';
import PasswordToggle from '../components/PasswordToggle.tsx';
import CopyField from '../components/CopyField.tsx';

// Constants
const MESSAGES = {
    CREATE_SUCCESS: 'Note created.',
    CREATE_ERROR: 'Failed to create note.',
    UNEXPECTED_ERROR: 'An error occurred while creating the note.',
} as const;

// Types
interface CreateNoteData {
    message?: string;
    noteId?: string;
    noteLink?: string;
    password?: string;
}

interface CreateNoteFormProps {
    onCreate: (noteId: string, message: string, noteLink: string, password?: string) => void;
    onError: (error: string) => void;
}

function MessageDisplay({ data }: { data: CreateNoteData }) {
    if (!data.message) return null;
    const isSuccess = !!data.noteId;

    return (
        <Message variant={isSuccess ? 'success' : 'error'}>
            <p class='font-semibold'>{data.message}</p>
            {isSuccess && data.noteLink && (
                <div class='mt-3 flex flex-col gap-3'>
                    <CopyField label='Share link' value={data.noteLink} title={data.noteLink} />
                    <p class='text-sm text-muted'>
                        The link works once. Whoever opens it destroys the note, so send it only to the person it is
                        for.
                    </p>
                    {data.password && (
                        <>
                            <div class='my-2 h-px bg-line' aria-hidden='true'></div>
                            <CopyField label='Password' value={data.password} title={data.password} />
                            <p class='text-sm text-muted'>
                                Send the password through a different channel than the link - someone who holds both can
                                open the note.
                            </p>
                        </>
                    )}
                </div>
            )}
        </Message>
    );
}

export default function CreateNote({ message }: { message?: string }) {
    const [formData, setFormData] = useState<CreateNoteData>({ message });

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create a note</CardTitle>
                <MessageDisplay data={formData} />
            </CardHeader>
            <CardContent>
                <CreateNoteForm
                    onCreate={(id, message, noteLink, password) => {
                        setFormData({ message, noteId: id, noteLink, password });
                    }}
                    onError={(error) => {
                        setFormData({ message: error, noteId: undefined, noteLink: '' });
                    }}
                />
            </CardContent>
        </Card>
    );
}

function CreateNoteForm({ onCreate, onError }: CreateNoteFormProps) {
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event: Event) => {
        event.preventDefault();
        if (submitting) return;
        setErrors({});
        setSubmitting(true);

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

            onCreate(result.noteId!, MESSAGES.CREATE_SUCCESS, `${globalThis.location.origin}/${result.link}`, password);
            form.reset();

            // Use requestAnimationFrame to prevent blocking the main thread
            requestAnimationFrame(() => {
                globalThis.scrollTo({ top: 0, behavior: 'smooth' });
            });
        } catch (error) {
            if (error instanceof v.ValiError) {
                const errors: Record<string, string> = {};
                for (const issue of error.issues) {
                    if (issue.path && issue.path.length > 0) {
                        const fieldName = issue.path[0].key as string;
                        errors[fieldName] = issue.message;
                    }
                }
                setErrors(errors);
                return;
            }

            const errorMessage = error instanceof Error ? error.message : MESSAGES.UNEXPECTED_ERROR;
            onError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form
            class='flex flex-col gap-6'
            method='post'
            onSubmit={handleSubmit}
            autoComplete='off'
            onKeyDown={(event) => {
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                    event.preventDefault();
                    (event.currentTarget as HTMLFormElement).requestSubmit();
                }
            }}
        >
            <FormGroup>
                <Label htmlFor='content' required>
                    Note content
                </Label>
                <Textarea
                    class='h-40 sm:h-48 resize-y font-mono text-sm leading-relaxed'
                    placeholder='Type your note here.'
                    name='content'
                    id='content'
                    error={errors.content}
                    required
                >
                </Textarea>
            </FormGroup>

            <FormGroup>
                <Label htmlFor='password'>
                    Password (optional)
                </Label>
                <PasswordToggle
                    name='password'
                    id='password'
                    placeholder='Leave blank for none'
                    helpText='Adds a second factor: the reader needs both the link and this password.'
                    error={errors.password}
                />
            </FormGroup>

            <FormGroup>
                <Label htmlFor='expiresIn'>
                    Expires after
                </Label>
                <Select
                    name='expiresIn'
                    id='expiresIn'
                    defaultValue={EXPIRY_OPTIONS['24h']}
                    helpText='Unopened notes are deleted automatically after this long.'
                    error={errors.expiresIn}
                >
                    {expirationOptions.map((option) => (
                        <SelectOption
                            key={option}
                            value={option}
                            selected={option === EXPIRY_OPTIONS['24h']}
                        >
                            {option}
                        </SelectOption>
                    ))}
                </Select>
            </FormGroup>

            <FormGroup>
                <Label htmlFor='manualDeletion'>
                    Manual deletion
                </Label>
                <Select
                    name='manualDeletion'
                    id='manualDeletion'
                    defaultValue={MANUAL_DELETION_OPTIONS.disabled}
                    helpText='Turns off destroy-after-viewing, so the note stays until someone deletes it. Anyone with access can delete it, so use with care.'
                    error={errors.manualDeletion}
                >
                    <SelectOption
                        value={MANUAL_DELETION_OPTIONS.disabled}
                        selected
                    >
                        Destroy after viewing (default)
                    </SelectOption>
                    <SelectOption value={MANUAL_DELETION_OPTIONS.enabled}>
                        Keep until someone deletes it
                    </SelectOption>
                </Select>
            </FormGroup>

            <div class='flex flex-col gap-3'>
                <Button type='submit' variant='primary' class='w-full' disabled={submitting} aria-busy={submitting}>
                    {submitting
                        ? (
                            <>
                                <span
                                    class='size-4 shrink-0 rounded-full border-2 border-white/30 border-t-white animate-spin motion-reduce:animate-none'
                                    aria-hidden='true'
                                >
                                </span>
                                Encrypting…
                            </>
                        )
                        : (
                            'Encrypt note'
                        )}
                </Button>
                <p class='flex items-center justify-center gap-1.5 text-center text-sm text-muted'>
                    All encryption happens in your browser - we never see your data
                </p>
            </div>

            <noscript>
                <Message variant='error'>
                    <p class='font-semibold'>JavaScript is required</p>
                    <p class='mt-1 text-sm'>
                        Encryption runs in your browser so the server never sees your note. Without JavaScript,
                        zero-knowledge encryption is not possible.
                    </p>
                    <a
                        href='/privacy#javascript-usage'
                        class='mt-2 inline-block text-sm underline underline-offset-2'
                    >
                        Learn more about JavaScript usage
                    </a>
                </Message>
            </noscript>
        </form>
    );
}
