import { generateDeterministicClientHash } from '../../hashing.ts';
import { prepareEncryption } from '../crypto-service.ts';
import {
    CreateNoteData,
    CreateNoteResult,
    DeleteNoteResult,
    GetEncryptedNoteResult,
    StorageProvider,
} from './storage-provider.ts';

export interface ApiNoteRequest {
    content: string;
    iv: string;
    password?: string;
    authKeyHash?: string;
    expiresIn?: string;
    manualDeletion?: boolean;
}

interface ApiErrorBody {
    message?: string;
    code?: string;
    retryAfter?: number;
}

const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
    400: 'The request could not be processed. Please check your input and try again.',
    403: 'The note could not be opened with the provided credentials.',
    404: 'Note not found. It may have been destroyed already, or the link is invalid.',
    405: 'The server rejected this request method.',
    429: 'You have made too many requests. Please wait a moment before trying again.',
};

function errorMessageFor(status: number, retryAfter?: number): string {
    const fallback = STATUS_FALLBACK_MESSAGES[status] ??
        'The request could not be completed. Please try again.';
    if (status === 429 && retryAfter !== undefined && retryAfter > 0) {
        return `You have made too many requests. Please try again in ${Math.ceil(retryAfter)} seconds.`;
    }
    return fallback;
}

/**
 * Extract a user-facing error message from a non-OK API response.
 * Error bodies are JSON (`{ message, retryAfter? }`); if the body is not
 * JSON (for example a proxy or CDN HTML page), fall back to a friendly
 * status-based message instead of surfacing the raw body.
 */
async function parseErrorMessage(response: Response): Promise<string> {
    try {
        const body = await response.json() as ApiErrorBody;
        if (typeof body?.message === 'string' && body.message.length > 0) {
            return body.message;
        }
        return errorMessageFor(response.status, body?.retryAfter);
    } catch {
        // Non-JSON body (HTML error page, proxy response, etc.)
        return errorMessageFor(response.status);
    }
}

/**
 * RemoteStorage implements the StorageProvider interface to interact with a backend API for note storage.
 * It handles creating, retrieving, and deleting notes by making HTTP requests to the appropriate endpoints.
 */
export default class RemoteStorage implements StorageProvider {
    async create(data: CreateNoteData): Promise<CreateNoteResult> {
        const { content, password, expiresIn, manualDeletion } = data;

        if (!content.trim()) {
            return { success: false, message: 'Note content cannot be empty' };
        }

        try {
            const { encryptedContent, passwordHash, authKey } = await prepareEncryption(content, password);
            const authKeyHash = await generateDeterministicClientHash(authKey);

            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: encryptedContent.encrypted,
                    password: passwordHash,
                    authKeyHash,
                    expiresIn,
                    manualDeletion,
                    iv: encryptedContent.iv,
                } as ApiNoteRequest),
            });

            if (!response.ok) {
                return { success: false, message: await parseErrorMessage(response), authKey };
            }

            const { noteId, ...res } = await response.json();
            // The auth key is always part of the link; password-protected notes
            // additionally require the password to decrypt.
            const link = `${noteId}#auth=${authKey}`;

            return { success: true, noteId, authKey, message: res.message, link };
        } catch (_err) {
            return { success: false, message: 'Failed to create note' };
        }
    }

    async get(noteId: string, authKey?: string, password?: string): Promise<GetEncryptedNoteResult> {
        try {
            const passwordHash = password ? await generateDeterministicClientHash(password) : undefined;
            const authKeyHash = authKey ? await generateDeterministicClientHash(authKey) : undefined;

            const response = await fetch(`/api/notes/${noteId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passwordHash, authKeyHash }),
            });

            if (!response.ok) {
                return { success: false, message: await parseErrorMessage(response) };
            }

            const note = await response.json();
            return { success: true, note };
        } catch {
            return { success: false, message: 'Failed to fetch note' };
        }
    }

    async delete(noteId: string, authKey?: string, password?: string): Promise<DeleteNoteResult> {
        try {
            const passwordHash = password ? await generateDeterministicClientHash(password) : undefined;
            const authKeyHash = authKey ? await generateDeterministicClientHash(authKey) : undefined;

            const response = await fetch(`/api/notes/${noteId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ passwordHash, authKeyHash }),
            });

            return response.ok ? { success: true } : { success: false, message: await parseErrorMessage(response) };
        } catch {
            return { success: false, message: 'Failed to delete note' };
        }
    }
}
